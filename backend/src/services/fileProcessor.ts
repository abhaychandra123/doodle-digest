import { ocrImage } from './llmService';

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
      const imageUrl = '';
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
export const processImage = async (fileBuffer: Buffer, mimeType: string, imageUrl: string = ''): Promise<PdfPage[]> => {
  try {
    const extractedText = await ocrImage(fileBuffer, mimeType);
    
    return [{
      pageNumber: 1,
      imageUrl,
      text: extractedText,
    }];
  } catch (error) {
    console.error("Error processing image on backend:", error);
    throw new Error("Could not extract text from the image.");
  }
};
