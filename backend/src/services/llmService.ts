import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Local types (avoid importing frontend types on backend)
interface PdfPage {
  pageNumber: number;
  imageUrl: string;
  text: string;
}
interface ChunkSummary {
  summary: string;
  doodleUrl: string | null;
  pageNumber: number;
}

// API key and lazy OpenAI import
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openaiClient: any | null = null;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// Prefer transparent PNGs by default for better overlay
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || '512x512';
const ENABLE_IMAGE_GENERATION = (process.env.ENABLE_IMAGE_GENERATION || 'true').toLowerCase() !== 'false';
// Image generation rate-limit controls
const IMAGE_MAX_PER_DOC = parseInt(process.env.OPENAI_IMAGE_MAX_PER_DOC || '4', 10);
const IMAGE_RATE_LIMIT_PER_MIN = parseInt(process.env.OPENAI_IMAGE_RATE_PER_MIN || '5', 10);
const IMAGE_REQUEST_INTERVAL_MS = Math.max(1000, Math.floor(60000 / Math.max(1, IMAGE_RATE_LIMIT_PER_MIN)) + 2500);

async function ensureOpenAI() {
  if (!OPENAI_API_KEY) return null;
  if (openaiClient) return openaiClient;
  try {
    const mod = await (new Function('s', 'return import(s)'))('openai');
    const OpenAI = (mod as any).default || (mod as any).OpenAI || (mod as any);
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
    return openaiClient;
  } catch {
    return null;
  }
}

interface TextChunk { text: string; pageNumber: number; }

export const chunkText = (pages: PdfPage[], chunkSize: number): TextChunk[] => {
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentPage = pages[0]?.pageNumber || 1;
  let wordCount = 0;
  for (const page of pages) {
    const words = page.text.split(/\s+/).filter(Boolean);
    if (currentChunk.length === 0) currentPage = page.pageNumber;
    for (const word of words) {
      currentChunk += word + ' ';
      wordCount++;
      if (wordCount >= chunkSize) {
        chunks.push({ text: currentChunk.trim(), pageNumber: currentPage });
        currentChunk = '';
        wordCount = 0;
        currentPage = page.pageNumber;
      }
    }
  }
  if (currentChunk.trim()) chunks.push({ text: currentChunk.trim(), pageNumber: currentPage });
  return chunks;
};

const getDoodlePrompt = (concept: string): string => {
  return [
    `Ultra-minimal stick-figure style doodle for: "${concept}".
    Rules:
    - Background: fully transparent.
    - Lines: 2–8 total strokes, thick black pen, no shading, no gradients.
    - Shapes: simple outlines only; no textures, no details.
    - Composition: icon-like, centered, lots of empty space.
    - Text: none.
    - Colors: strictly black lines; optionally 1 tiny pale-yellow highlight only if essential.
    - Purpose: aid quick understanding, not realism.`
  ][0];
};

const callChat = async (messages: any, opts?: { json?: boolean; temperature?: number }) => {
  const client = await ensureOpenAI();
  if (!client) return null;
  try {
    const r = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      response_format: opts?.json ? { type: 'json_object' } : undefined,
    });
    return r?.choices?.[0]?.message?.content ?? '';
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return null;
  }
};

const callImage = async (prompt: string): Promise<string | null> => {
  if (!ENABLE_IMAGE_GENERATION) return null;
  const client = await ensureOpenAI();
  if (!client) return null;
  try {
    const params: any = {
      model: IMAGE_MODEL,
      prompt,
      size: IMAGE_SIZE,
      n: 1,
    };
    // Prefer transparent background when supported (gpt-image-1)
    if (IMAGE_MODEL === 'gpt-image-1') {
      params.background = 'transparent';
    }
    const r = await client.images.generate(params);
    const data = r?.data?.[0];
    const b64 = (data as any)?.b64_json as string | undefined;
    const url = (data as any)?.url as string | undefined;
    if (b64) return `data:image/png;base64,${b64}`;
    if (url) return url;
    return null;
  } catch (error) {
    console.error('OpenAI image error:', error);
    return null;
  }
};

const summarizeAndDoodleChunk = async (chunk: TextChunk): Promise<ChunkSummary> => {
  const sys = 'You are an expert academic note-taker.';
  const user = `Analyze the text and output ONLY JSON with fields {"summary": string, "doodle_concept": string}.
Text: ${chunk.text}`;
  try {
    const content = await callChat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ], { json: true });

    if (!content) {
      const firstSentence = chunk.text.split(/(?<=[.!?])\s+/)[0] || chunk.text.slice(0, 180);
      const fallbackSummary = `**Key idea:** ${firstSentence}`;
      return { summary: fallbackSummary, doodleUrl: null, pageNumber: chunk.pageNumber };
    }

    let summary = '';
    let doodleConcept = '';
    try {
      const parsed = JSON.parse(content);
      summary = String(parsed.summary || '').trim();
      doodleConcept = String(parsed.doodle_concept || '').trim();
    } catch {
      summary = content.trim();
      doodleConcept = content.slice(0, 100);
    }

    // Defer image generation to a throttled pass to avoid 429s
    return { summary, doodleUrl: null, pageNumber: chunk.pageNumber };
  } catch (error) {
    console.error(`Failed to process chunk for page ${chunk.pageNumber}:`, error);
    return { summary: 'AI failed to generate a summary for this section.', doodleUrl: null, pageNumber: chunk.pageNumber };
  }
};

export const generateScribble = async (doodleDescription: string): Promise<string | null> => {
  const imagePrompt = getDoodlePrompt(doodleDescription);
  return await callImage(imagePrompt);
};

export const generateNotebookSummary = async (summaries: ChunkSummary[]): Promise<string> => {
  const combinedSummaries = summaries.map(s => s.summary).join('\n\n');
  const sys = 'You create concise, visually organized study notes in markdown.';
  const user = `Create a single markdown notes page based on the following summaries.
Include 3-5 doodle placeholders in the format [DOODLE: description].
---\n${combinedSummaries}\n---`;
  const content = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  return content?.trim() || `# Notes\n\n${combinedSummaries}`;
};

export const generateDoodleSummary = async (pages: PdfPage[], onProgress: (message: string) => void): Promise<ChunkSummary[]> => {
  onProgress('Step 2/6: Breaking paper into sections...');
  const chunks = chunkText(pages, 150);
  if (chunks.length === 0) throw new Error('Could not break the document into text sections.');
  onProgress(`Step 3/6: Doodling & summarizing ${chunks.length} sections...`);
  const summaries = await Promise.all(chunks.map(summarizeAndDoodleChunk));

  // Throttled, limited image generation to respect per-minute limits
  const list = summaries.filter(Boolean) as ChunkSummary[];
  if (ENABLE_IMAGE_GENERATION && list.length > 0 && IMAGE_MAX_PER_DOC > 0) {
    const count = Math.min(IMAGE_MAX_PER_DOC, list.length);
    const step = list.length / count;
    const indices = Array.from({ length: count }, (_, i) => Math.min(list.length - 1, Math.floor(i * step)));

    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      const prompt = getDoodlePrompt(list[idx].summary);
      if (i > 0) {
        await new Promise(res => setTimeout(res, IMAGE_REQUEST_INTERVAL_MS));
      }
      try {
        list[idx].doodleUrl = await callImage(prompt);
      } catch (e) {
        console.warn('Doodle generation skipped due to error:', e);
      }
    }
  }

  return list;
};

export const generateTotalSummary = async (summaries: ChunkSummary[]): Promise<string> => {
  const combinedSummaries = summaries.map(s => s.summary).join('\n\n');
  const sys = 'You create concise final summaries in markdown.';
  const user = `Create a final, consolidated summary page (<=120 words) with a fun title and a final thought.\n---\n${combinedSummaries}\n---`;
  const content = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  return content?.trim() || `## Total Summary\n\n${combinedSummaries}`;
};

export const generateMiniExercise = async (summaries: ChunkSummary[]): Promise<string> => {
  const combinedSummaries = summaries.map(s => s.summary).join('\n\n');
  const sys = 'You create short review quizzes in markdown.';
  const user = `Create a 3-4 question mini-exercise. Use the exact format with Q1, --- separator, and A1 as specified.\n---\n${combinedSummaries}\n---`;
  const content = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  return content?.trim() || '# 📘 Mini-Exercise: Check Your Knowledge!\n\nQ1: What is one key idea?\n---\nA1: <your answer>';
};

export const generateCreatorStory = async (fullText: string): Promise<string> => {
  const sys = 'You are an engaging science storyteller in the style of Veritasium.';
  const user = `Write a narrative about the key scientists related to the following text. Use markdown headings and an engaging tone.\n---\n${fullText}\n---`;
  const content = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  return content?.trim() || `# Story\n\n${fullText.slice(0, 500)}...`;
};

export const suggestImprovements = async (text: string): Promise<string> => {
  const sys = 'You are an expert editor for academic writing. Output clean HTML with paragraphs.';
  const user = `Improve clarity, tone, and flow while preserving meaning. Output ONLY HTML (no <html> or <body>).\n---\n${text}\n---`;
  const content = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);
  return content?.trim() || `<p>${text}</p>`;
};

export const ocrImage = async (imageBuffer: Buffer, mimeType: string): Promise<string> => {
  const client = await ensureOpenAI();
  if (!client) return '';
  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;
  try {
    const r = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this image. Output only the transcribed text.' },
            { type: 'image_url', image_url: { url: dataUrl } as any },
          ] as any,
        },
      ],
      temperature: 0.0,
    });
    return r?.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI OCR error:', error);
    return '';
  }
};
