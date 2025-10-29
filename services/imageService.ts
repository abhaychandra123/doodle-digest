import { GoogleGenAI } from '@google/genai';
import { PdfPage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const processImage = async (file: File): Promise<PdfPage[]> => {
  const imagePart = await fileToGenerativePart(file);
  const prompt = "You are an expert OCR engine. Extract all text from this image of a document page. Maintain the original paragraph structure and formatting as best as possible. Do not add any commentary or summaries, only output the transcribed text.";
  
  const response = await ai.models.generateContent({
      model: textModel, // gemini-2.5-flash is multimodal
      contents: { parts: [imagePart, { text: prompt }] },
  });

  const extractedText = response.text;
  
  const imageUrl = URL.createObjectURL(file);

  return [{
    pageNumber: 1,
    imageUrl: imageUrl, // This will be a temporary blob URL
    text: extractedText,
  }];
};
