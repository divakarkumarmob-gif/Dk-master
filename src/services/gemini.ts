import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUESTIONS } from "../constants/fallbackData";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const handleGeminiCall = async (fn: () => Promise<any>, fallback?: any, cacheKey?: string) => {
  // Check cache first
  if (cacheKey) {
    const cached = localStorage.getItem(`gemini_cache_${cacheKey}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 12 hours
      if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
        return data;
      }
    }
  }

  try {
    const data = await fn();
    if (cacheKey && data) {
      localStorage.setItem(`gemini_cache_${cacheKey}`, JSON.stringify({ data, timestamp: Date.now() }));
    }
    return data;
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
    
    // Only log if it's NOT a quota error (to keep console clean)
    if (!isQuotaError) {
      console.error("Gemini API Error:", error);
    } else {
      console.warn("Gemini Quota limit hit. Serving fallback.");
    }

    if (isQuotaError) {
      return fallback || null;
    }
    throw error;
  }
};

export const geminiService = {
  async generateQuestions(subject: string, chapter: string, count: number = 30) {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    
    // Cache per specific chapter test
    const cacheKey = `qs_${subject}_${chapter}_${count}`;
    
    return handleGeminiCall(async () => {
      const prompt = `Generate ${count} NEET level multiple choice questions for ${subject} chapter: "${chapter}". 
      Format: JSON array of objects { text, options: [4 strings], correctAnswer: (0-3), explanation }.
      Ensure accuracy and clinical relevance for Biology, and conceptual depth for Physics/Chemistry.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return JSON.parse(response.text || '[]');
    }, FALLBACK_QUESTIONS, cacheKey);
  },

  async solveDoubt(doubt: string, context?: string) {
    // Only cache if it's the specific "Quote" request to save API calls on home screen
    const isQuoteRequest = doubt.includes("motivational quote");
    const cacheKey = isQuoteRequest ? `daily_quote_${new Date().toDateString()}` : undefined;

    return handleGeminiCall(async () => {
      const prompt = `User Doubt: ${doubt}\nContext: ${context || 'Targeting NEET Exam'}\n
      ROLE: You are an expert NEET Teacher.
      RULES:
      1. STICK STRICTLY TO NCERT content and study-related topics. 
      2. If the user asks something NOT related to studies (Bollywood, gossip, random facts not in syllabus), politely refuse and say you only help with NEET studies.
      3. LANGUAGE: Use a mix of English and Hinglish (Hindi in Latin script) - natural and human-like.
      4. TONE: Very friendly, human-like, empathic. After answering, ALWAYS ask a human-like follow-up like "Aur koi problem ho to batao, main yahin hoon!" or "I hope ye clear hai? Kuch aur puchna hai?".
      5. FORMATTING: Use simple text. Avoid symbols like #, *, $, /.
      6. Ensure the answer is exactly what is asked based on NCERT books.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }, "I am sorry, but my neural core is currently cooling down (Quota exceeded). Please practicing NCERT chapters meanwhile!", cacheKey);
  },

  async summarizeResponse(text: string) {
    return handleGeminiCall(async () => {
      const prompt = `Summarize the following explanation in exactly 2-3 short, clear sentences. 
      Avoid all special symbols like #, *, $, /. Output only the plain summary text: \n\n${text}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }, text.substring(0, 100) + "...");
  },

  async getStudyPlan(performanceData: string) {
    return handleGeminiCall(async () => {
      const prompt = `Based on these test results: ${performanceData}, suggest 3 weak topics and a 7-day study plan specifically for NEET preparation. 
      Use simple dashed lines instead of asterisks for bullets. Avoid #, $, /.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }, "Focus on NCERT Biology diagrams and Physics formulas for the next 7 days. Keep practicing!");
  }
};
