import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUESTIONS } from "../constants/fallbackData";
import { db, auth } from "./firebase";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

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
    console.error("Gemini API Error:", error);
    return fallback || null;
  }
};

export const geminiService = {
  // ... generateQuestions ...
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

  async solveDoubt(doubt: string, context?: string, imageData?: { data: string, mimeType: string }) {
    if (!doubt && !imageData) return null;
    const keywords = doubt ? doubt.toLowerCase().split(' ').filter(word => word.length > 4) : [];

    // 1. Search Memory (Firestore) - Only if it's text-only
    if (!imageData && doubt) {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
            const q = query(
                collection(db, 'interactions'), 
                where('keywords', 'array-contains-any', keywords.length > 0 ? keywords : [doubt]),
                where('userId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) return snapshot.docs[0].data().answer;
        } catch(e) {
            console.error("Memory search failed:", e);
        }
      }
    }

    // 2. Ask AI
    const answer = await handleGeminiCall(async () => {
        const parts: any[] = [];
        if (imageData) {
          parts.push({
            inlineData: imageData
          });
        }
        if (doubt) {
          parts.push({ text: doubt });
        } else if (imageData) {
          parts.push({ text: "What is in this image? Explain simply." });
        }

        const promptContext = `Context: ${context || 'NEET'}\n
        ROLE: NEET Expert.
        RULES: ONLY direct answer. MAX 2 sentences. No 'Hi', 'Hello', 'As a...', or 'Good luck'. Hinglish. Plain text only. No symbols.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: { parts: [...parts, { text: `Context: ${context || 'NEET'}` }] },
          config: {
            systemInstruction: "You are a NEET Expert. RULES: Provide a concise directly relevant answer. MAX 5 sentences. NO conversational fillers (Hi/Hello/As a...). Output Hinglish. Plain text only. No special symbols."
          }
        });
        return response.text;
    }, "I am sorry, but my neural core is currently cooling down. Please practice NCERT chapters meanwhile!");

    // 3. Save to memory (Simplified for now, skipping image memory storage to save space)
    if (answer && !imageData && doubt) {
        try {
            await addDoc(collection(db, 'interactions'), {
                userId: auth.currentUser?.uid,
                question: doubt,
                answer: answer,
                keywords: keywords.length > 0 ? keywords : [doubt],
                timestamp: serverTimestamp()
            });
        } catch(e) {
            console.error("Failed to save to memory:", e);
        }
    }

    return answer;
  },

  async analyzeImage(imageData: string, customPrompt?: string) {
    return handleGeminiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: imageData.split(',')[1], mimeType: "image/png" } },
            { text: customPrompt || "Analyze this image and summarize it for a NEET student in Hinglish. Focus on identifying diagrams, formulas, or biological structures." }
          ]
        },
        config: {
          systemInstruction: "You are an expert NEET mentor. Be concise. Use plain text. Focus only on key points found in image."
        }
      });
      return response.text;
    }, "Unable to analyze the image at the moment.");
  },

  async summarizeResponse(text: string) {
    return handleGeminiCall(async () => {
      const prompt = `Summarize: ${text}. Plain text only.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }, text.substring(0, 100) + "...");
  },

  async getStudyPlan(performanceData: string) {
    return handleGeminiCall(async () => {
      const prompt = `Study plan based on: ${performanceData}. Plain text.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    }, "Focus on NCERT Biology diagrams and Physics formulas for the next 7 days. Keep practicing!");
  }
};
