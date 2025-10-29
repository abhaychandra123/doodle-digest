
import { PdfPage } from '../types';

// TypeScript declarations for CDN-loaded library
declare const pdfjsLib: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const processPdf = async (file: File): Promise<PdfPage[]> => {
  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }

      try {
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const pages: PdfPage[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Render page to canvas to get an image
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = window.document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport: viewport }).promise;
          }
          const imageUrl = canvas.toDataURL('image/png');

          // Extract text content
          const textContent = await page.getTextContent();
          const text = textContent.items.map((item: any) => item.str).join(' ');

          pages.push({
            pageNumber: i,
            imageUrl,
            text,
          });
        }
        resolve(pages);
      } catch (error) {
        console.error("Error processing PDF:", error);
        reject(new Error("Could not parse the PDF file. It might be corrupted or protected."));
      }
    };

    fileReader.onerror = () => {
        reject(new Error('Error reading the file.'));
    };

    fileReader.readAsArrayBuffer(file);
  });
};