
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared Rate Limiting Logic
let rateLimitedUntil = 0;
const COOLDOWN_MS = 60000; // 1 minute cooldown if we hit a limit

export const isRateLimited = () => Date.now() < rateLimitedUntil;

export const handleApiError = (error: any, context: string) => {
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
