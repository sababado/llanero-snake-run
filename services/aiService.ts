

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

// Fallback Data for Offline Mode (Enhanced Cache - Authentic Llanero/Yopal Slang)
const FALLBACKS = {
    start: [
        "¡Arre biros, camarita!",
        "¡Desde Yopal pa'l mundo!",
        "¡Suelte el rejo, pariente!",
        "¡Ajilando, que es pa' hoy!",
        "¡A trote largo, cuñao!",
        "¡Con la venia de la Virgen!",
        "¡Póngase las alpargatas!",
        "¡Zapatéelo, que hay espinas!",
        "¡El Llano es grande, carajo!",
        "¡Vamonos, que anochece!",
        "¡A lo que vinimos, catire!",
        "¡Firme como botalón de hato!"
    ],
    milestone: [
        "¡Va más rápido que incendio!",
        "¡Usted sí es mucho criollo!",
        "¡Ta' comiendo más que chigüiro!",
        "¡Más llanero que el topocho!",
        "¡Ese es mi gallo giro!",
        "¡Rindiendo como arroz llanero!",
        "¡Siga así, no le afloje!",
        "¡Va volando, pariente!",
        "¡Eso es pura casta casanareña!",
        "¡Qué jodienda tan buena!",
        "¡Bravo como toro de casta!",
        "¡Se le nota la clase, compa!"
    ],
    relic: [
        "¡La Virgen de Manare lo cuida!",
        "¡Bendito sea mi Dios!",
        "¡Milagro en el estero!",
        "¡La Patrona está con usted!",
        "¡Ave María Purísima!",
        "¡Qué santas vainas!",
        "¡Bendición del cielo, camarita!",
        "¡Se le apareció la Virgen!",
        "¡Gloria al Casanare!",
        "¡Santo patrono, qué suerte!"
    ],
    game_over: [
        "¡Se le aguó la fiesta!",
        "¡Quedó silbando en la loma!",
        "¡Se nos fue la lapa!",
        "¡Ay caracha, mi compa!",
        "¡Mucho guate pa' esta vaina!",
        "¡Guinde la hamaca y descanse!",
        "¡Se le mojó la canoa!",
        "¡A llorar al Caño Seco!",
        "¡Lo cogió la noche, pariente!",
        "¡Quedó viendo un chispero!",
        "¡Se acabó el parrando!",
        "¡Vaya a pelar papas, cuñao!"
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
    
    // Updated Persona: Authentic Yopal Narrator
    const baseInstruction = `You are "Don Chepe", an old, wise, and witty narrator from Yopal, Casanare. Speak in authentic Colombian Llanero slang. Use words like "pariente", "camarita", "cuñao", "vaina", "criollo". Max 6 words.`;

    if (type === 'start') {
        prompt = `${baseInstruction} Say something energetic to start the journey in the plains.`;
    } else if (type === 'milestone') {
        prompt = `${baseInstruction} Praise the player's score of ${context?.score} using a rural metaphor (e.g., fast horse, strong bull).`;
    } else if (type === 'relic') {
        prompt = `${baseInstruction} Exclaim "Holy Virgin of Manare!" or similar religious blessing.`;
    } else if (type === 'game_over') {
        prompt = `${baseInstruction} Make a short, funny comment about losing or crashing in the savannah.`;
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

export const generateFoodFact = async (foodName: string): Promise<string> => {
    if (isRateLimited()) return `${foodName} es un plato típico delicioso del Llano.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a local guide from Yopal. Describe the Colombian food "${foodName}" in 1 short, fun sentence for a tourist. Mention why it's special in Casanare.`
        });
        return response.text?.trim() || `${foodName} es muy sabroso.`;
    } catch (error) {
        return `${foodName} es un clásico del Llano.`;
    }
}

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
                        // 'Puck' is often punchier and faster-feeling, good for a game announcer
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