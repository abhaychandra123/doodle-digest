import { GoogleGenAI, Type } from '@google/genai';
import { ChunkSummary, PdfPage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

interface TextChunk {
  text: string;
  pageNumber: number;
}

const chunkText = (pages: PdfPage[], chunkSize: number): TextChunk[] => {
    const chunks: TextChunk[] = [];
    let currentChunk = "";
    let currentPage = pages[0]?.pageNumber || 1;
    let wordCount = 0;

    for (const page of pages) {
        const words = page.text.split(/\s+/).filter(Boolean);
        if (currentChunk.length === 0) {
          currentPage = page.pageNumber;
        }

        for (const word of words) {
            currentChunk += word + " ";
            wordCount++;
            if (wordCount >= chunkSize) {
                chunks.push({ text: currentChunk.trim(), pageNumber: currentPage });
                currentChunk = "";
                wordCount = 0;
                currentPage = page.pageNumber;
            }
        }
    }

    if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), pageNumber: currentPage });
    }
    return chunks;
};

const getDoodlePrompt = (concept: string): string => {
    const coreInstruction = `
    The image MUST have a transparent background.
    The style is CRITICAL: it must be a **completely hand-drawn sketch**.
    - **Aesthetic:** Think loose, organic, and imperfect, like a quick doodle in a notebook with a fine-tip black pen or pencil. Embrace a handmade feel.
    - **Lines:** Use sketch-like, slightly uneven lines with varying thickness. Avoid clean, perfect vector-style lines. The lines should feel natural.
    - **Color:** Strictly use black ink for outlines and details. For a single highlight, use a soft, muted yellow (like a highlighter pen) OR a muted blue. Do not use any other colors.
    - **Simplicity:** Focus only on the single most important concept from the summary. Keep it minimalist and clear.
    - **Text:** If any text is included, it MUST be in a neat, legible, handwritten script (like 'Patrick Hand'). The text must be large and clear. Ensure generous spacing between letters and words for readability.
    `;

    const prompts = [
        `Create a hand-drawn visual metaphor of: '${concept}'. ${coreInstruction}`,
        `Design a simple, hand-drawn concept diagram illustrating: '${concept}'. ${coreInstruction}`,
        `Make a charming, hand-drawn doodle that visually represents: '${concept}'. ${coreInstruction}`,
        `Draw a hand-drawn, infographic-style sketch of: '${concept}'. ${coreInstruction}`,
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
}

const summarizeAndDoodleChunk = async (chunk: TextChunk): Promise<ChunkSummary> => {
    const summaryPrompt = `You are an expert academic researcher creating a study note. Your task is to analyze the following text and extract two things: a summary and a concept for a doodle.
        
    Instructions:
    1.  Read the text and identify the single most critical, core finding.
    2.  **Summary:** Write a concise 1-2 sentence summary of this key takeaway. Emphasize key terms with markdown bold (**term**) and important concepts with markdown italics (*concept*). Use emphasis sparingly.
    3.  **Doodle Concept:** Based on the summary, describe a simple, clear, and metaphorical visual for a hand-drawn doodle. This should be a literal description of what to draw, not an abstract idea. For example, instead of "doodle about memory", say "a simple sketch of a brain with a lightbulb turning on".
    
    TEXT: "${chunk.text}"`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            summary: {
                type: Type.STRING,
                description: "The 1-2 sentence markdown summary of the core finding."
            },
            doodle_concept: {
                type: Type.STRING,
                description: "A concrete, literal description of a simple doodle representing the summary."
            }
        },
        required: ['summary', 'doodle_concept']
    };

    try {
        const summaryResponse = await ai.models.generateContent({
            model: textModel,
            contents: summaryPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const resultJson = JSON.parse(summaryResponse.text);
        const { summary, doodle_concept } = resultJson;

        const doodlePrompt = getDoodlePrompt(doodle_concept);

        let doodleUrl: string | null = null;
        try {
            const imageResponse = await ai.models.generateImages({
                model: imageModel,
                prompt: doodlePrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                },
            });
            if (imageResponse.generatedImages?.[0]?.image?.imageBytes) {
                const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
                doodleUrl = `data:image/png;base64,${base64ImageBytes}`;
            }
        } catch (imageError) {
            console.warn(`Could not generate doodle for chunk on page ${chunk.pageNumber}. Error:`, imageError);
            // Gracefully fail, doodleUrl will remain null
        }
        
        return { summary, doodleUrl, pageNumber: chunk.pageNumber };
    } catch (error) {
        console.error(`Failed to process chunk for page ${chunk.pageNumber}:`, error);
        // Return a partial result on failure to avoid crashing the whole process
        return {
            summary: "AI failed to generate a summary for this section.",
            doodleUrl: null,
            pageNumber: chunk.pageNumber
        };
    }
};

export const generateScribble = async (doodleDescription: string): Promise<string | null> => {
    const prompt = `
    Create a very simple, minimalist, **completely hand-drawn sketch** for: '${doodleDescription}'.
    - **Aesthetic:** It should look like a quick, informal doodle sketched in a notepad with a pen. Embrace natural imperfections and a handmade feel.
    - **Background:** The image MUST have a transparent background.
    - **Lines:** Use loose, sketch-like lines. Avoid perfectly straight or clean digital lines.
    - **Color:** Strictly use black ink. If a single accent is needed, use a muted academic blue. No other colors.
    - **Text:** If text is present, it must be in a clear, legible, handwritten script (like 'Patrick Hand'). Keep it large and easy to read with generous spacing.
    `;
    try {
        const imageResponse = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });
        if (imageResponse.generatedImages?.[0]?.image?.imageBytes) {
            const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error)
    {
        console.warn(`Could not generate scribble for: ${doodleDescription}.`, error);
        return null;
    }
};


export const generateNotebookSummary = async (summaries: ChunkSummary[]): Promise<string> => {
    const combinedSummaries = summaries.map(s => s.summary).join('\n\n');

    const prompt = `
    You are an expert student who excels at creating concise, visually organized study notes.
    Transform the following collection of summaries from a research paper into a single, cohesive page of notes.

    Your output should be formatted in markdown and follow these rules strictly:
    1.  **Create a Title:** Start with a catchy, handwritten-style title for the notes page.
    2.  **Structure:** Use headings (#), bullet points (*), and bold text (**) to organize the information clearly.
    3.  **Casual Tone:** Write in a slightly informal, personal note-taking style. Use phrases like "Key takeaway:", "Basically...", or "Don't forget:".
    4.  **Incorporate Doodles:** Strategically embed placeholders for small, simple doodles that illustrate key concepts. The format MUST be exactly \`[DOODLE: a concise description of the doodle]\`. For example: \`[DOODLE: a simple brain with gears turning]\` or \`[DOODLE: a magnifying glass over a DNA strand]\`. Aim for 3-5 doodles throughout the notes.
    5.  **Emphasis:** Use markdown's bold and italics for emphasis on important terms or findings.
    6.  **Cohesion:** Synthesize the points into a flowing narrative, not just a list of disconnected facts.

    Here is the content to summarize:
    ---
    ${combinedSummaries}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate notebook summary:", error);
        return "# Notebook Summary Failed\n\nSorry, the AI couldn't compile the notebook view. Please refer to the page-by-page summary.";
    }
};


export const generateDoodleSummary = async (
  pages: PdfPage[],
  onProgress: (message: string) => void
): Promise<ChunkSummary[]> => {

  onProgress('Step 2/6: Breaking paper into sections...');
  const chunks = chunkText(pages, 150); // Reduced chunk size for more doodles
  if (chunks.length === 0) {
    throw new Error("Could not break the document into text sections.");
  }
  
  onProgress(`Step 3/6: Doodling & summarizing ${chunks.length} sections...`);

  const summaryPromises = chunks.map(chunk => summarizeAndDoodleChunk(chunk));
  const settledSummaries = await Promise.all(summaryPromises);

  // Filter out any potential complete failures, though summarizeAndDoodleChunk is designed to not throw.
  return settledSummaries.filter(Boolean) as ChunkSummary[];
};

export const generateTotalSummary = async (summaries: ChunkSummary[]): Promise<string> => {
    const combinedSummaries = summaries.map(s => s.summary).join('\n\n');
    const prompt = `
    You are an expert student summarizing study notes.
    Based on the following section summaries from a research paper, create a final, consolidated summary page.

    Follow these rules strictly:
    1.  **Title:** Start with a fun, engaging title like "In a Nutshell..." or "The Big Picture!". The title should be a markdown heading (e.g., # In a Nutshell...).
    2.  **Content:** Write a short, final summary of all the key points. The summary must be a maximum of 120 words.
    3.  **Tone:** Use a doodle-style, handwritten tone — like you're explaining it in a notebook with sketches. It should be casual and easy to understand.
    4.  **Doodle Suggestions:** Include small emoji suggestions like 🔬, 💡, 📊, 🧠, ✨ in-line with the text to indicate where a small doodle could go.
    5.  **Final Thought:** End with one short, powerful, and thoughtful concluding sentence that sums up the entire report's main message. This should be a separate paragraph.
    6.  **Formatting:** Use markdown. Use bold (**) for key terms.

    Here are the section summaries:
    ---
    ${combinedSummaries}
    ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate total summary:", error);
        return "## Total Summary Failed\n\nSorry, the AI couldn't create the final summary.";
    }
};

export const generateMiniExercise = async (summaries: ChunkSummary[]): Promise<string> => {
    const combinedSummaries = summaries.map(s => s.summary).join('\n\n');
    const prompt = `
    You are a friendly teacher creating a quick quiz to help a student review a research paper.
    Based on the following summaries, create a "Mini Exercise" page.

    Follow these rules strictly:
    1.  **Title:** Start with a title using a markdown heading, like "# 📘 Mini-Exercise: Check Your Knowledge!".
    2.  **Questions:** Create 3 to 4 short questions to test understanding of the key points. Include a mix of multiple-choice, true/false, and fill-in-the-blank questions.
    3.  **Tone:** Keep the tone friendly, encouraging, and doodle-style. Use emojis like 🤔, ✅, ❌, ✏️.
    4.  **Structure:** For each question, provide the question, then the answer and a one-line explanation clearly separated by '---'.
    5.  **Formatting:** Use markdown.
        -   Use this exact format for each question block:
        -   Start each question with \`Q1:\`, \`Q2:\`, etc.
        -   Place the question and its options on the lines after.
        -   Use \`---\` on its own line to separate the question from the answer.
        -   Start the answer block with \`A1:\`, \`A2:\`, etc. matching the question number.
        -   Include a short explanation below the answer, starting with \`*Explanation: ...*\`.

        Example:
        Q1: What is the main topic? 🤔
        *   A) Option 1
        *   B) Option 2
        *   C) Option 3
        ---
        A1: **B) Option 2** ✅
        *Explanation: A very short reason why this is the correct answer.*

    Here are the summaries to base the quiz on:
    ---
    ${combinedSummaries}
    ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate mini exercise:", error);
        return "## Mini-Exercise Failed\n\nSorry, the AI couldn't create the quiz.";
    }
};

export const generateCreatorStory = async (fullText: string): Promise<string> => {
    const prompt = `
    You are an expert storyteller and science communicator, writing in the style of Derek Muller from the YouTube channel Veritasium.
    Your task is to analyze the provided text from a research paper and craft a compelling, narrative-driven story about the key scientists and creators behind the core concepts mentioned.

    **Instructions:**
    1.  **Identify Core Concepts:** Read the text and identify the 2-3 most important scientific concepts, theories, or discoveries.
    2.  **Identify the People:** For these concepts, find the key individuals responsible for them.
    3.  **Craft a Narrative:** Weave their personal and professional stories together. Do not just list facts. Create a story with a hook, a struggle, a breakthrough, and an impact.
        *   **The Hook:** Start with a compelling question or a surprising fact that grabs the reader's attention.
        *   **The Struggle:** Describe the challenges, conventional wisdom, and intellectual battles they faced.
        *   **The "Aha!" Moment:** Detail the breakthrough. How did they arrive at their discovery?
        *   **The Impact:** Explain the significance of their work and how it connects back to the concepts in the original paper text.
    4.  **Veritasium Style:**
        *   Use an engaging, curious, and slightly informal tone.
        *   Ask rhetorical questions.
        *   Use analogies and simple explanations for complex topics.
        *   Focus on the human story of science: the collaboration, competition, genius, and perseverance.
    5.  **Formatting:**
        *   Use Markdown for formatting.
        *   Use headings (#, ##) for sections.
        *   Use bold (**) and italics (*) for emphasis.
        *   The final output must be a cohesive, long-form, article-style story.

    **Research Paper Text:**
    ---
    ${fullText}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate creator story:", error);
        return "## Story Generation Failed\n\nSorry, the AI couldn't create a story from this document. It might be too short or on a topic without well-known creators.";
    }
};

export const suggestImprovements = async (text: string): Promise<string> => {
    const prompt = `
    You are an expert editor reviewing a piece of academic or research writing. Your task is to improve its clarity, tone, and flow while preserving the core meaning.

    Follow these rules:
    1.  **Correct Grammar and Typos:** Fix any spelling mistakes, punctuation errors, and grammatical issues.
    2.  **Enhance Clarity:** Rephrase convoluted sentences to be more direct and understandable. Break down long, complex sentences if necessary.
    3.  **Improve Flow:** Ensure smooth transitions between ideas and paragraphs.
    4.  **Academic Tone:** Maintain a professional and academic tone suitable for a research paper or report. Avoid overly casual language.
    5.  **Preserve Meaning:** The improved text must retain the original author's intended meaning and core ideas. Do not add new information or opinions.
    6.  **Output Format:** Format the output as clean HTML, with each paragraph wrapped in \`<p>\` tags. Do not include \`<html>\` or \`<body>\` tags.

    Original Text:
    ---
    ${text}
    ---

    Improved HTML:
    `;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate writing improvements:", error);
        return "<p>Sorry, the AI couldn't generate suggestions at this time.</p>";
    }
};
