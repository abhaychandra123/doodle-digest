import { ocrImage } from './llmService';
import { createCanvas } from 'canvas';

// --- Define PdfPage type locally for this service ---
interface PdfPage {
  pageNumber: number;
  imageUrl: string;
  text: string;
}

// This is a Node.js compatible version of your frontend's pdfService.ts
export const processPdf = async (fileBuffer: Buffer): Promise<PdfPage[]> => {
  try {
    // Use a true runtime dynamic import so TS doesn't transpile to require()
    const dynamicImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const mod = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjsLib: any = mod?.default || mod;

    const typedarray = new Uint8Array(fileBuffer);
    // Disable worker in Node to avoid workerSrc resolution issues
    const pdf = await pdfjsLib.getDocument({ data: typedarray, disableWorker: true }).promise;
    const pages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');

      // Render a lightweight PNG for overlay in the UI
      const viewport = page.getViewport({ scale: 1.2 });
      const canvasFactory = {
        create: (w: number, h: number) => {
          const canvas = createCanvas(Math.ceil(w), Math.ceil(h));
          const context = canvas.getContext('2d');
          return { canvas, context } as any;
        },
        reset: (c: any, w: number, h: number) => {
          c.canvas.width = Math.ceil(w);
          c.canvas.height = Math.ceil(h);
        },
        destroy: (c: any) => {
          // help GC
          c.canvas.width = 0;
          c.canvas.height = 0;
        }
      };
      const { canvas, context } = canvasFactory.create(viewport.width, viewport.height) as any;
      await page.render({ canvasContext: context, viewport, canvasFactory }).promise;
      const buffer: Buffer = (canvas as any).toBuffer('image/png');
      const imageUrl = `data:image/png;base64,${buffer.toString('base64')}`;

      // We skip image generation on the backend for now as it's complex
      // and not strictly needed for the AI processing.
      // We can add it back later if needed.
      pages.push({
        pageNumber: i,
        imageUrl,
        text,
      });
    }
    return pages;
  } catch (error) {
    console.error("Error processing PDF on backend:", error);
    throw new Error("Could not parse the PDF file.");
  }
};

// This is a Node.js compatible version of your frontend's imageService.ts
export const processImage = async (fileBuffer: Buffer, mimeType: string): Promise<PdfPage[]> => {
  try {
    const extractedText = await ocrImage(fileBuffer, mimeType);
    
    // We don't have a file URL here, but we can create a base64 Data URI
    // to store in the DB, just like the frontend did.
    const imageUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    
    return [{
      pageNumber: 1,
      imageUrl: imageUrl,
      text: extractedText,
    }];
  } catch (error) {
    console.error("Error processing image on backend:", error);
    throw new Error("Could not extract text from the image.");
  }
};
