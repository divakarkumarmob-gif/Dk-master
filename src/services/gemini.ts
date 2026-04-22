import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUESTIONS } from "../constants/fallbackData";
import { db, auth } from "./firebase";

/**
 * ARCHITECTURAL DESIGN: AI MANAGER (SINGLETON) - PRODUCTION READY
 */

const CONFIG = {
  MAX_DAILY_CALLS: 50,
  MIN_DELAY_MS: 3000, 
  CACHE_TTL: {
    STATIC: 1000 * 60 * 60 * 24 * 7, // 7 Days
    DYNAMIC: 1000 * 60 * 60 * 24,    // 24 Hours
  }
};

class AIManager {
  private static instance: AIManager;
  private ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private lastCallTime = 0;

  private constructor() {}

  public static getInstance(): AIManager {
    if (!AIManager.instance) AIManager.instance = new AIManager();
    return AIManager.instance;
  }

  private async checkDailyLimit(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    return count < CONFIG.MAX_DAILY_CALLS;
  }

  private incrementUsage() {
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (count + 1).toString());
  }

  private getCache(key: string) {
    const mem = this.memoryCache.get(key);
    if (mem && Date.now() < mem.expiry) return mem.data;

    try {
      const stored = localStorage.getItem(`gemini_cache_${key}`);
      if (stored) {
        const { data, expiry } = JSON.parse(stored);
        if (Date.now() < expiry) {
          this.memoryCache.set(key, { data, expiry });
          return data;
        }
      }
    } catch (e) {}
    return null;
  }

  private setCache(key: string, data: any, type: 'STATIC' | 'DYNAMIC' = 'DYNAMIC') {
    const expiry = Date.now() + CONFIG.CACHE_TTL[type];
    this.memoryCache.set(key, { data, expiry });
    localStorage.setItem(`gemini_cache_${key}`, JSON.stringify({ data, expiry }));
  }

  private async waitForThrottle() {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < CONFIG.MIN_DELAY_MS) {
      await new Promise(r => setTimeout(r, CONFIG.MIN_DELAY_MS - elapsed));
    }
    this.lastCallTime = Date.now();
  }

  public async executeSafeCall<T>(
    operationId: string, 
    fn: () => Promise<T>, 
    fallback: T, 
    cacheType: 'STATIC' | 'DYNAMIC' = 'DYNAMIC'
  ): Promise<T> {
    const cached = this.getCache(operationId);
    if (cached) return cached;

    if (this.pendingRequests.has(operationId)) return this.pendingRequests.get(operationId);

    const allowed = await this.checkDailyLimit();
    if (!allowed) return fallback;

    const requestPromise = (async () => {
      await this.waitForThrottle();
      try {
        const result = await fn();
        if (result) {
          this.setCache(operationId, result, cacheType);
          this.incrementUsage();
          return result;
        }
        return fallback;
      } catch (error) {
        console.error(`AI System Error [${operationId}]:`, error);
        return fallback;
      }
    })();

    this.pendingRequests.set(operationId, requestPromise);
    try {
      return await requestPromise;
    } finally {
      this.pendingRequests.delete(operationId);
    }
  }

  public getRawAI() {
    return this.ai;
  }
}

const manager = AIManager.getInstance();

export const validateQuestion = (q: any): any => {
  if (!q || typeof q !== 'object') return null;
  const text = q.text || q.question || "Analysis failed.";
  const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["N/A", "N/A", "N/A", "N/A"];
  return {
    ...q, text, options, 
    correctAnswer: q.correctAnswer ?? 0, 
    explanation: q.explanation || "NCERT reference required.",
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`
  };
};

export const safeJsonParse = (text: string | null | undefined, fallback: any = []) => {
    if (!text) return fallback;
    try {
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return Array.isArray(parsed) ? parsed.map(validateQuestion).filter(Boolean) : parsed;
    } catch (e) {
        const match = text.match(/\[[\s\S]*\]/);
        return match ? safeJsonParse(match[0], fallback) : fallback;
    }
};

export const geminiService = {
  async generateQuestions(subject: string, chapter: string, count: number = 30) {
    const cacheKey = `qs_${subject}_${chapter}_${count}`;
    return manager.executeSafeCall(cacheKey, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${count} NEET MCQs: ${subject} - ${chapter}. JSON array: [{text, options, correctAnswer, explanation}].`,
        config: { responseMimeType: "application/json" }
      });
      return safeJsonParse(resp.text, FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS, 'STATIC');
  },

  async generateFullSyllabusTest() {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `major_test_${today}`;
    return manager.executeSafeCall(cacheKey, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `NEET Major Test (180 Qs: 90 Bio, 45 Phy, 45 Chem). JSON object: { Biology: [], Physics: [], Chemistry: [] }.`,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(resp.text || '{}');
      return [...(data.Physics || []), ...(data.Chemistry || []), ...(data.Biology || [])].map(validateQuestion);
    }, FALLBACK_QUESTIONS, 'STATIC');
  },

  async generateErrorFixQuestions(weakConcepts: string, count: number = 20) {
    return manager.executeSafeCall(`efix_${weakConcepts.substring(0, 50)}`, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Targeted NEET practice for weak areas: ${weakConcepts}. ${count} MCQs. JSON array.`,
        config: { responseMimeType: "application/json" }
      });
      return safeJsonParse(resp.text, FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS, 'DYNAMIC');
  },

  async solveDoubt(doubt: string, context?: string, imageData?: { data: string, mimeType: string }, cacheKey?: string) {
    if (!doubt && !imageData) return "Input missing.";
    const key = cacheKey || (doubt && doubt.length < 50 ? `doubt_${doubt.toLowerCase().trim()}` : `raw_${Date.now()}`);
    
    return manager.executeSafeCall(key, async () => {
      const idToken = await auth.currentUser?.getIdToken();
      const result = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ question: doubt, image: imageData, context })
      });
      const data = await result.json();
      return data.answer || "Processing error.";
    }, "System cooling down. Reference NCERT.", 'DYNAMIC');
  },

  async analyzeImage(imageData: string, customPrompt?: string) {
    const key = `img_an_${imageData.substring(0, 100)}`;
    return manager.executeSafeCall(key, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { inlineData: { data: imageData.split(',')[1], mimeType: "image/png" } },
          { text: customPrompt || "Analyze for NEET student." }
        ]
      });
      return resp.text || "Analysis failed.";
    }, "Image analysis offline.", 'DYNAMIC');
  },

  async extractQuestionsFromImage(imageData: string) {
    const key = `ocr_${imageData.substring(0, 100)}`;
    return manager.executeSafeCall(key, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { inlineData: { data: imageData.split(',')[1], mimeType: "image/png" } },
          { text: "Extract MCQs JSON array: [{text, options, correctAnswer, explanation}]" }
        ],
        config: { responseMimeType: "application/json" }
      });
      return safeJsonParse(resp.text, []);
    }, [], 'STATIC');
  },

  async summarizeResponse(text: string | null | undefined): Promise<string> {
    if (!text) return "No data.";
    return manager.executeSafeCall(`sum_${text.substring(0, 50)}`, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize: ${text}`
      });
      return resp.text || "Summary failed.";
    }, "Summary failed.", 'DYNAMIC');
  },

  async getStudyPlan(performanceData: string) {
    return manager.executeSafeCall(`plan_${performanceData.substring(0, 50)}`, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze NEET performance and suggest plan: ${performanceData}`
      });
      return resp.text || "Plan failed.";
    }, "Focus on Biology NCERT.", 'DYNAMIC');
  },

  async getYoutubeVideoId(topic: string, subject?: string) {
    const { getFallbackVideoId } = await import('../data/videoFallbacks');
    const localId = getFallbackVideoId(topic);
    if (localId) return localId;

    return manager.executeSafeCall(`yt_${topic}`, async () => {
      const resp = await manager.getRawAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find YouTube ID for NEET lecture: ${topic}. 11 char ID only.`,
        config: {
           tools: [{ googleSearch: {} }] as any
        }
      });
      return resp.text?.match(/[a-zA-Z0-9_-]{11}/)?.[0] || null;
    }, null, 'STATIC');
  }
};
