import { FALLBACK_QUESTIONS } from "../constants/fallbackData";
import { db, auth } from "./firebase";
import { useAppStore } from "../store/useAppStore";

/**
 * ARCHITECTURAL DESIGN: AI MANAGER (SINGLETON) - PRODUCTION READY
 */

type RequestPriority = 'high' | 'normal' | 'background';

interface QueueItem<T> {
  id: string;
  priority: RequestPriority;
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  fallback: T;
  cacheType: 'STATIC' | 'DYNAMIC';
  timestamp: number;
}

const CONFIG = {
  MAX_DAILY_CALLS: 50,
  BASE_DELAY_MS: 2000, 
  CACHE_TTL: {
    STATIC: 1000 * 60 * 60 * 24 * 7, // 7 Days
    DYNAMIC: 1000 * 60 * 60 * 24,    // 24 Hours
  }
};

class AIManager {
  private static instance: AIManager;
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private lastCallTime = 0;
  
  // Advanced Queue System
  private queue: QueueItem<any>[] = [];
  private isProcessingQueue = false;
  private activeRequestMap = new Map<string, { abortController?: AbortController }>();

  private constructor() {}

  public static getInstance(): AIManager {
    if (!AIManager.instance) AIManager.instance = new AIManager();
    return AIManager.instance;
  }

  private async checkDailyLimit(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    if (count >= CONFIG.MAX_DAILY_CALLS) {
        useAppStore.getState().showToast(`Daily AI limit reached (${CONFIG.MAX_DAILY_CALLS}/50). Kal try karein!`, 'error');
        return false;
    }
    return true;
  }

  private incrementUsage() {
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (count + 1).toString());
  }

  // Multi-level cache with invalidation support
  public invalidateCache(prefix: string) {
    for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) this.memoryCache.delete(key);
    }
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gemini_cache_' + prefix)) {
            localStorage.removeItem(key);
        }
    }
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
        } else {
          localStorage.removeItem(`gemini_cache_${key}`); // Clear expired
        }
      }
    } catch (e) {}
    return null;
  }

  private setCache(key: string, data: any, type: 'STATIC' | 'DYNAMIC' = 'DYNAMIC') {
    const expiry = Date.now() + CONFIG.CACHE_TTL[type];
    this.memoryCache.set(key, { data, expiry });
    try {
        localStorage.setItem(`gemini_cache_${key}`, JSON.stringify({ data, expiry }));
    } catch (e) {
        console.warn("localStorage quota exceeded, clearing cache", e);
        localStorage.clear(); // Emergency clear if quota filled
    }
  }

  // Adaptive throttling based on priority
  private async adaptiveThrottle(priority: RequestPriority) {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    let delay = CONFIG.BASE_DELAY_MS;
    
    // High priority requests get shorter delay, background get longer
    if (priority === 'high') delay = 1000;
    if (priority === 'background') delay = 5000;

    if (elapsed < delay) {
      await new Promise(r => setTimeout(r, delay - elapsed));
    }
    this.lastCallTime = Date.now();
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      // Sort by priority and timestamp
      this.queue.sort((a, b) => {
        const pWeight = { high: 0, normal: 1, background: 2 };
        if (pWeight[a.priority] !== pWeight[b.priority]) {
          return pWeight[a.priority] - pWeight[b.priority]; // Lower weight comes first
        }
        return a.timestamp - b.timestamp; // FIFO for same priority
      });

      const item = this.queue.shift();
      if (!item) continue;

      // Check cache one last time before execution to prevent duplicate work if something was processed while waiting
      const cached = this.getCache(item.id);
      if (cached) {
         item.resolve(cached);
         continue;
      }

      await this.adaptiveThrottle(item.priority);

      try {
        const result = await item.fn();
        if (result) {
          this.setCache(item.id, result, item.cacheType);
          this.incrementUsage();
          item.resolve(result);
        } else {
          item.resolve(item.fallback);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
           console.log(`[Queue] Request ${item.id} was aborted.`);
           // Don't resolve/reject if aborted, or resolve with fallback depending on needs.
           // We'll resolve with fallback for safety
           item.resolve(item.fallback);
        } else {
           console.error(`AI System Error [${item.id}]:`, error);
           
           // Show specific AI error to user
           const errorMsg = error.message.toLowerCase();
           let userFriendlyMsg = "AI link latency. Please check your data connection.";
           
           if (errorMsg.includes('api key')) userFriendlyMsg = "AI Configuration Error: API key missing on server.";
           if (errorMsg.includes('quota') || errorMsg.includes('limit')) userFriendlyMsg = "AI Quota exceeded or usage blocked.";
           if (errorMsg.includes('429')) userFriendlyMsg = "Rate limit reached. System is cooling down (approx 30-60s).";
           if (errorMsg.includes('offens') || errorMsg.includes('safe')) userFriendlyMsg = "AI Security: Request blocked by safety filter.";
           if (errorMsg.includes('model')) userFriendlyMsg = "AI Link restricted to approved models only.";

           useAppStore.getState().showToast(userFriendlyMsg, 'error');
           useAppStore.getState().addErrorLog(userFriendlyMsg);
           item.resolve(item.fallback); // Fail gracefully
        }
      } finally {
        this.activeRequestMap.delete(item.id);
        this.pendingRequests.delete(item.id);
      }
    }

    this.isProcessingQueue = false;
  }

  public cancelRequest(operationId: string) {
    // Remove from queue if pending
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== operationId);
    
    // Abort if currently active
    const active = this.activeRequestMap.get(operationId);
    if (active?.abortController) {
      active.abortController.abort();
    }
    
    this.pendingRequests.delete(operationId);
    this.activeRequestMap.delete(operationId);
  }

  public async executeSafeCall<T>(
    operationId: string, 
    fn: () => Promise<T>, 
    fallback: T, 
    cacheType: 'STATIC' | 'DYNAMIC' = 'DYNAMIC',
    priority: RequestPriority = 'normal'
  ): Promise<T> {
    const cached = this.getCache(operationId);
    if (cached) return cached;

    if (this.pendingRequests.has(operationId)) {
        return this.pendingRequests.get(operationId);
    }

    // Check daily limit before adding to queue
    const canProceed = await this.checkDailyLimit();
    if (!canProceed) return fallback;

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        id: operationId,
        priority,
        fn,
        resolve,
        reject,
        fallback,
        cacheType,
        timestamp: Date.now()
      });
    });

    this.pendingRequests.set(operationId, promise);
    this.processQueue(); // Fire and forget
    
    return promise;
  }
}

const manager = AIManager.getInstance();

// Helper to call server AI
async function callServerAI(path: string, body: any) {
    // For APK/Mobile, we might need a full URL. We use VITE_API_BASE_URL if provided.
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullPath = `${baseUrl}${path}`;
    
    const idToken = await auth.currentUser?.getIdToken();
    const result = await fetch(fullPath, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify(body)
    });
    if (!result.ok) {
        const err = await result.json();
        throw new Error(err.error || 'AI Server error');
    }
    return result.json();
}

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
      const resp = await callServerAI('/api/ai/generate', {
        prompt: `Generate ${count} NEET MCQs: ${subject} - ${chapter}. JSON array: [{text, options, correctAnswer, explanation}].`,
        responseMimeType: "application/json"
      });
      return safeJsonParse(resp.text, FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS, 'STATIC', 'high');
  },

  async generateFullSyllabusTest() {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `major_test_${today}`;
    return manager.executeSafeCall(cacheKey, async () => {
      const resp = await callServerAI('/api/ai/generate', {
        prompt: `NEET Major Test (180 Qs: 90 Bio, 45 Phy, 45 Chem). JSON object: { Biology: [], Physics: [], Chemistry: [] }.`,
        responseMimeType: "application/json"
      });
      const data = JSON.parse(resp.text || '{}');
      return [...(data.Physics || []), ...(data.Chemistry || []), ...(data.Biology || [])].map(validateQuestion);
    }, FALLBACK_QUESTIONS, 'STATIC', 'high');
  },

  async generateErrorFixQuestions(weakConcepts: string, count: number = 20) {
    return manager.executeSafeCall(`efix_${weakConcepts.substring(0, 50)}`, async () => {
      const resp = await callServerAI('/api/ai/generate', {
        prompt: `Targeted NEET practice for weak areas: ${weakConcepts}. ${count} MCQs. JSON array.`,
        responseMimeType: "application/json"
      });
      return safeJsonParse(resp.text, FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS, 'DYNAMIC', 'normal');
  },

  async solveDoubt(doubt: string, context?: string, imageData?: { data: string, mimeType: string }, cacheKey?: string, priority: 'high' | 'normal' | 'background' = 'high') {
    if (!doubt && !imageData) return "Input missing.";
    const key = cacheKey || (doubt && doubt.length < 50 ? `doubt_${doubt.toLowerCase().trim()}` : `raw_${Date.now()}`);
    
    return manager.executeSafeCall(key, async () => {
      const result = await callServerAI('/api/ask', {
        question: doubt, 
        image: imageData, 
        context 
      });
      return result.answer || "Processing error.";
    }, "System cooling down. Reference NCERT.", 'DYNAMIC', priority);
  },

  async analyzeImage(imageData: string, customPrompt?: string) {
    const key = `img_an_${imageData.substring(0, 100)}`;
    return manager.executeSafeCall(key, async () => {
      const resp = await callServerAI('/api/ai/analyze-image', {
        image: imageData,
        prompt: customPrompt || "Analyze for NEET student."
      });
      return resp.text || "Analysis failed.";
    }, "Image analysis offline.", 'DYNAMIC', 'high');
  },

  async extractQuestionsFromImage(imageData: string) {
    const key = `ocr_${imageData.substring(0, 100)}`;
    return manager.executeSafeCall(key, async () => {
      const resp = await callServerAI('/api/ai/analyze-image', {
        image: imageData,
        prompt: "Extract MCQs JSON array: [{text, options, correctAnswer, explanation}]"
      });
      return safeJsonParse(resp.text, []);
    }, [], 'STATIC', 'high');
  },

  async summarizeResponse(text: string | null | undefined): Promise<string> {
    if (!text) return "No data.";
    return manager.executeSafeCall(`sum_${text.substring(0, 50)}`, async () => {
      const resp = await callServerAI('/api/ai/generate', {
        prompt: `Summarize: ${text}`
      });
      return resp.text || "Summary failed.";
    }, "Summary failed.", 'DYNAMIC', 'background');
  },

  async getStudyPlan(performanceData: string) {
    return manager.executeSafeCall(`plan_${performanceData.substring(0, 50)}`, async () => {
      const resp = await callServerAI('/api/ai/generate', {
        prompt: `Analyze NEET performance and suggest plan: ${performanceData}`
      });
      return resp.text || "Plan failed.";
    }, "Focus on Biology NCERT.", 'DYNAMIC', 'background');
  },

  async getYoutubeVideoId(topic: string, subject?: string): Promise<{ id: string, blocked?: boolean } | null> {
    const { getFallbackVideoId } = await import('../data/videoFallbacks');
    const localId = getFallbackVideoId(topic);
    if (localId) return { id: localId };

    // Use a completely new cache key prefix to ensure any old hallucinated IDs are ignored globally
    return manager.executeSafeCall(`ytsearch_v4_${topic}`, async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const idToken = await auth.currentUser?.getIdToken();
        
        // Use a strict 4.5 second timeout on the client to guarantee 5s total interaction
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const result = await fetch(`${baseUrl}/api/youtube-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ topic }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (result.ok) {
           const data = await result.json();
           if (data.id) {
               return { id: data.id, blocked: data.blocked };
           }
           return null;
        }
      } catch (e) {
        console.warn("YouTube search API failed or timed out:", e);
      }
      return null;
    }, null, 'STATIC', 'background');
  }
};
