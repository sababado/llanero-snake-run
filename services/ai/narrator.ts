
import { Modality } from "@google/genai";
import { ai, isRateLimited, handleApiError } from './client';
import { Language } from "../../types";

export type CommentaryContext = 'start' | 'milestone' | 'game_over' | 'relic' | 'powerup';

// Fallback Data for Offline Mode (Enhanced Cache - Authentic Llanero/Yopal Slang)
const FALLBACKS = {
    es: {
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
        ],
        powerup: [
            "¡Eso revive a un muerto!",
            "¡Con energía pal' camino!",
            "¡Más despierto que el gallo!",
            "¡Pura gasolina criolla!",
            "¡Sabroso ese tinto!",
            "¡Café cerrero pa'l viajero!",
            "¡Quedó como nuevo, pariente!"
        ]
    },
    en: {
        start: [
            "Let's ride, compadre!",
            "Giddy up, amigo!",
            "Welcome to the Yanos!",
            "Vamonos! Time to ride!",
            "Saddle up, partner!",
            "The savannah awaits!",
            "Show me your grit, pariente!",
            "Let's catch some Capybaras!"
        ],
        milestone: [
            "You are faster than a wildfire!",
            "Epa! That's good riding!",
            "Strong like a bull, amigo!",
            "You are flying, compa!",
            "Pure Yanero style!",
            "Don't stop now, partner!",
            "Look at you go!",
            "Ay caramba, so fast!"
        ],
        relic: [
            "The Holy Virgin protects you!",
            "It's a miracle, amigo!",
            "Blessed by the plains!",
            "Holy cow! A blessing!",
            "The patron saint is watching!",
            "Luck is on your side!"
        ],
        game_over: [
            "Ay caracha! You crashed!",
            "The party is over, amigo.",
            "Hang up your hammock and rest.",
            "You hit the wall, pariente!",
            "Game over, compadre.",
            "Looks like you need a siesta.",
            "Too fast for your own good!",
            "Better luck next time, cowboy."
        ],
        powerup: [
            "Strong coffee for a strong rider!",
            "Wake up! Pura energía!",
            "That tinto hits the spot!",
            "Full speed ahead, amigo!",
            "Fuel for the journey!"
        ]
    }
};

const getFallback = (type: CommentaryContext, lang: Language): string => {
    const dict = FALLBACKS[lang] || FALLBACKS.es;
    // @ts-ignore
    const list = dict[type] || dict.game_over;
    return list[Math.floor(Math.random() * list.length)];
};

export const generateNarratorCommentary = async (
  type: CommentaryContext, 
  lang: Language,
  context?: { score?: number, cause?: string }
): Promise<string> => {
  // Use local cache 80% of the time to save API calls
  if (Math.random() < 0.8 || isRateLimited()) {
      return getFallback(type, lang);
  }

  try {
    let prompt = "";
    
    const isEnglish = lang === 'en';
    const baseInstruction = isEnglish 
        ? `You are "Don Chepe", a Colombian cowboy speaking English. Speak with a Colombian sentence structure. Use phrases like "My friend", "Listen to me", and mix in Spanglish words like "Amigo", "Compadre", "Fiesta", "Vaina". Do not sound American. Max 8 words.`
        : `You are "Don Chepe", an old, wise narrator from Yopal. Speak in authentic Colombian Llanero slang. Use words like "pariente", "camarita", "cuñao", "vaina", "criollo". Max 6 words.`;

    if (type === 'start') {
        prompt = `${baseInstruction} Say something energetic to start the journey.`;
    } else if (type === 'milestone') {
        prompt = `${baseInstruction} Praise the player's score of ${context?.score} using a rural metaphor.`;
    } else if (type === 'relic') {
        prompt = `${baseInstruction} React with religious joy to finding a holy relic.`;
    } else if (type === 'powerup') {
        prompt = `${baseInstruction} React enthusiastically to drinking a strong coffee (tinto).`;
    } else if (type === 'game_over') {
        prompt = `${baseInstruction} Make a short, funny comment about crashing or losing.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || getFallback(type, lang);
  } catch (error) {
    handleApiError(error, "generateNarratorCommentary");
    return getFallback(type, lang);
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

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

// Helper to enforce pronunciation for the English TTS model reading Spanish/Spanglish words
const phoneticize = (text: string, lang: Language): string => {
    let t = text;
    
    if (lang === 'en') {
        // ACCENTULATOR: Force thick Colombian/Spanish accent on English words
        
        // Th -> D / Z
        t = t.replace(/\bThe\b/g, "Da");
        t = t.replace(/\bthe\b/g, "da");
        t = t.replace(/\bThis\b/g, "Dis");
        t = t.replace(/\bthis\b/g, "dis");
        t = t.replace(/\bThat\b/g, "Dat");
        t = t.replace(/\bthat\b/g, "dat");
        t = t.replace(/\bThey\b/g, "Dey");
        t = t.replace(/\bthey\b/g, "dey");
        
        // V -> B
        t = t.replace(/v/g, "b");
        t = t.replace(/V/g, "B");
        
        // Is -> Ees
        t = t.replace(/\bis\b/g, "ees");
        t = t.replace(/\bIs\b/g, "Ees");
        
        // It -> Eet
        t = t.replace(/\bit\b/g, "eet");
        
        // ing -> een
        t = t.replace(/ing\b/g, "een");
        
        // You -> Joo
        t = t.replace(/\byou\b/gi, "joo");
        t = t.replace(/\byour\b/gi, "joor");
        
        // H (initial) -> J (harder H)
        t = t.replace(/\bHello\b/gi, "Jello");
        t = t.replace(/\bHere\b/gi, "Jere");
        
        // Harder Rs (doubling them often forces a trill or harder tap in TTS)
        // We apply this selectively to avoid destroying words
        t = t.replace(/r/g, "rr"); 
    }

    // Force Spanish "LL" sound to be "Y" for the English TTS engine
    // Use "Yah" to avoid "Yay" pronunciation
    t = t.replace(/Llanos/gi, "Yah-nos");
    t = t.replace(/Llano/gi, "Yah-no");
    t = t.replace(/Llanero/gi, "Yah-nero");
    t = t.replace(/Caballo/gi, "Cabayo");
    
    return t;
};

let ttsAudioContext: AudioContext | null = null;

export const speakLlaneroText = async (text: string, lang: Language = 'es') => {
    // If text is empty or we are rate limited, skip TTS to save quota
    if (!text || isRateLimited()) return;

    try {
        if (!ttsAudioContext) {
            ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        if (ttsAudioContext.state === 'suspended') {
            await ttsAudioContext.resume();
        }

        // Fix pronunciation before sending to API
        const speechText = phoneticize(text, lang);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: speechText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Charon = Deeper, more neutral/mature tone. Less "Skater" (Puck) or "Trailer" (Fenrir).
                        prebuiltVoiceConfig: { voiceName: 'Charon' }, 
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
