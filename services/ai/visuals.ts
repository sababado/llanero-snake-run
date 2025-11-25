
import { ai, isRateLimited, handleApiError } from './client';

export const generateLlaneroBackground = async (): Promise<string | null> => {
  if (isRateLimited()) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: 'Digital art, landscape of the Colombian plains "Llanos Orientales" in Casanare Yopal at sunset. Features a river, morichal palm trees, orange and pink sky, flat green savannah. Vibrant, vector art style suitable for a video game background. No text.' }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });
    
    return extractImageFromResponse(response);
  } catch (error) {
    handleApiError(error, "generateLlaneroBackground");
    return null;
  }
};

export const generateVirgenAsset = async (): Promise<string | null> => {
  if (isRateLimited()) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: 'Game icon of The Virgin of Manare. Religious pixel art or vector style. Gold and blue colors. Simple, bold lines, recognizable as a holy figure holding a child. Isolated on white background. High contrast.' }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });
    
    return extractImageFromResponse(response);
  } catch (error) {
    handleApiError(error, "generateVirgenAsset");
    return null;
  }
};

const extractImageFromResponse = (response: any): string | null => {
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
}
