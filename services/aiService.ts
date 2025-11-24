
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Rate Limiting Logic
let rateLimitedUntil = 0;
const COOLDOWN_MS = 60000; // 1 minute cooldown if we hit a limit

const isRateLimited = () => Date.now() < rateLimitedUntil;

const handleApiError = (error: any, context: string) => {
    // Check for 429 status or message content indicating quota exhaustion
    if (error?.status === 429 || error?.toString().includes('429') || error?.message?.includes('429')) {
        if (!isRateLimited()) {
            console.warn(`[${context}] API Quota Exceeded (429). Switching to offline fallbacks for 60s.`);
        }
        rateLimitedUntil = Date.now() + COOLDOWN_MS;
    } else {
        console.error(`Error in ${context}:`, error);
    }
};

// Fallback Data for Offline Mode (Enhanced Cache)
const FALLBACKS = {
    start: [
        "¡Arre biros!",
        "¡Vamonos pariente!",
        "¡Jupa, familia!",
        "¡A darle guaya!",
        "¡Se vino el joropo!",
        "¡Póngase las pilas!",
        "¡Ajilando que es tarde!",
        "¡A trote largo, compa!",
        "¡El llano es lindo, carajo!",
        "¡Suelte el rejo!",
        "¡Con el pie derecho!",
        "¡A lo que vinimos!"
    ],
    milestone: [
        "¡Eso va es pa' lante!",
        "¡Qué llanerazo!",
        "¡Siga así, compa!",
        "¡Va volando!",
        "¡Buena esa, pariente!",
        "¡Usted sí es criollo!",
        "¡Va como viento en popa!",
        "¡Ese es mi gallo!",
        "¡No le afloje!",
        "¡Firme como el Araguaney!",
        "¡Está rindiendo el día!",
        "¡Mucho pulso, camarita!"
    ],
    relic: [
        "¡Ave María, qué bendición!",
        "¡La Virgen lo acompañe!",
        "¡Santo patrono!",
        "¡Bendito sea Dios!",
        "¡Milagro en el hato!",
        "¡La Patrona está con usted!",
        "¡Gloria al cielo!",
        "¡Qué santas vainas!",
        "¡Bendición del cielo!",
        "¡Se le apareció la Virgen!"
    ],
    game_over: [
        "¡Se nos fue la lapa!",
        "¡Ay caracha!",
        "¡Qué vaina tan seria!",
        "¡Se acabó el parrando!",
        "¡A recoger los bártulos!",
        "¡Lo cogió la noche!",
        "¡Hasta aquí llegó el rio!",
        "¡Guinde la hamaca, pariente!",
        "¡A llorar pa' los caños!",
        "¡Se le mojó la canoa!",
        "¡Quedó viendo un chispero!",
        "¡Vaya a pelar papas!"
    ]
};

const getFallback = (type: CommentaryContext): string => {
    const list = FALLBACKS[type] || FALLBACKS.game_over;
    return list[Math.floor(Math.random() * list.length)];
};

// --- Background & Asset Generation ---

export const generateLlaneroBackground = async (): Promise<string | null> => {
  if (isRateLimited()) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: 'Digital art, wide angle landscape of the Colombian plains "Llanos Orientales" in Casanare Yopal at sunset. Features a river, morichal palm trees, orange and pink sky, flat green savannah. Vibrant, vector art style suitable for a video game background. No text.' }]
      },
      config: {
        imageConfig: {
            aspectRatio: "4:3"
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

// --- Text Generation ---

export type CommentaryContext = 'start' | 'milestone' | 'game_over' | 'relic';

export const generateNarratorCommentary = async (
  type: CommentaryContext, 
  context?: { score?: number, cause?: string }
): Promise<string> => {
  // Use local cache 80% of the time to save API calls
  if (Math.random() < 0.8 || isRateLimited()) {
      return getFallback(type);
  }

  try {
    let prompt = "";
    
    // EXTREMELY SHORT prompts for speed
    const baseInstruction = `You are "Don Chepe", a llanero narrator. Speak in Colombian Llanero slang. Max 5 words.`;

    if (type === 'start') {
        prompt = `${baseInstruction} Say "Let's start!" enthusiastically in slang.`;
    } else if (type === 'milestone') {
        prompt = `${baseInstruction} Praise score ${context?.score}.`;
    } else if (type === 'relic') {
        prompt = `${baseInstruction} Say "Holy Virgin!" or "Blessing!".`;
    } else if (type === 'game_over') {
        prompt = `${baseInstruction} React to loss.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || getFallback(type);
  } catch (error) {
    handleApiError(error, "generateNarratorCommentary");
    return getFallback(type);
  }
};

// --- Audio / TTS Generation ---

// Decode base64 helper
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let ttsAudioContext: AudioContext | null = null;

export const speakLlaneroText = async (text: string) => {
    // If text is empty or we are rate limited, skip TTS to save quota
    if (!text || isRateLimited()) return;

    try {
        if (!ttsAudioContext) {
            ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        if (ttsAudioContext.state === 'suspended') {
            await ttsAudioContext.resume();
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // 'Puck' is often punchier and faster-feeling
                        prebuiltVoiceConfig: { voiceName: 'Puck' }, 
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return;

        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            ttsAudioContext,
            24000,
            1,
        );

        const source = ttsAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ttsAudioContext.destination);
        source.start();

    } catch (e) {
        handleApiError(e, "speakLlaneroText");
    }
};

export const generateGastronomyList = async (): Promise<string[]> => {
    return []; 
}
