import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUESTIONS } from "../constants/fallbackData";
import { db, auth } from "./firebase";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const handleGeminiCall = async (fn: () => Promise<any>, fallback?: any, cacheKey?: string) => {
  // Check cache first
  if (cacheKey) {
    try {
      const cached = localStorage.getItem(`gemini_cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Cache parse failed:", e);
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

const safeJsonParse = (text: string, fallback: any = []) => {
    try {
        // Remove markdown code blocks if present
        const cleanJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Raw text:", text);
        return fallback;
    }
};

export const geminiService = {
  // ... generateQuestions ...
  async generateQuestions(subject: string, chapter: string, count: number = 30) {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");
    
    // Cache per specific chapter test
    const cacheKey = `qs_${subject}_${chapter}_${count}`;
    
    return handleGeminiCall(async () => {
      const prompt = `Act as a Senior NEET Subject Matter Expert. 
      Generate ${count} highly accurate, strictly NEET-level Multiple Choice Questions for the ${subject} chapter: "${chapter}".
      
      CRITICAL REQUIREMENTS:
      1. BASIS: Questions must be 100% based on the NCERT syllabus.
      2. VARIETY: Include a mix of:
         - Direct conceptual questions.
         - Assertion & Reason type questions.
         - Statement I & Statement II type questions.
         - Numerical problems (for Physics/Chemistry).
      3. SUBJECT SPECIFICITY:
         - BIOLOGY: Focus on NCERT lines, examples, and clinical/ecological relevance.
         - PHYSICS: Focus on conceptual application and formula-based derivations.
         - CHEMISTRY: Focus on mechanism-based organic, periodic trends, and stoichiometry.
      4. DIFFICULTY: Maintain a mix of Easy (20%), Moderate (50%), and Hard/Critical Thinking (30%).
      
      FORMAT: Return ONLY a JSON array of objects with this schema:
      {
        "text": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0-3 index,
        "explanation": "Detailed explanation mentioning the specific NCERT concept/page logic"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return safeJsonParse(response.text || '[]', FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS, cacheKey);
  },

  async generateErrorFixQuestions(weakConcepts: string, count: number = 20) {
    return handleGeminiCall(async () => {
      const prompt = `Act as an AI NEET Tutor. The student is struggling with these concepts: ${weakConcepts}.
      Generate ${count} NEW practice questions that directly target the CORE CONFUSION in these areas.
      Ensure the questions are strictly NEET pattern (NCERT based).
      
      FORMAT: JSON array of objects:
      {
        "text": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0-3 index,
        "explanation": "Explanation fixing the common misconception in this concept"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return safeJsonParse(response.text || '[]', FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS);
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
                where('keywords', 'array-contains-any', (keywords.length > 0 ? keywords : [doubt]).slice(0, 30)),
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
        
        const result = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: doubt })
        });
        
        if (!result.ok) {
            const errorText = await result.text();
            throw new Error(`Server Error (${result.status}): ${errorText}`);
        }
        
        const contentType = result.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await result.json();
            return data.answer || "I'm having trouble connecting right now.";
        } else {
            const text = await result.text();
            return text || "Connection unstable. Please try again.";
        }
    }, "I am sorry, but my neural core is currently cooling down. Please practice NCERT chapters meanwhile!");

    // 3. Save to memory (Simplified for now)
    const userId = auth.currentUser?.uid;
    if (answer && !imageData && doubt && userId) {
        try {
            await addDoc(collection(db, 'interactions'), {
                userId: userId,
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

  async extractQuestionsFromImage(imageData: string) {
    return handleGeminiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: imageData.split(',')[1], mimeType: "image/png" } },
            { text: `Act as a Professional Question Scanner for NEET Exams. 
              Extract all Multiple Choice Questions (MCQs) from this image. 
              Only extract questions that are complete with at least 4 options.
              For each question, identify the correct answer index (0-3) and provide a short educational explanation.
              
              FORMAT: Return ONLY a JSON array of objects with this schema:
              {
                "text": "Extracted question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0-3,
                "explanation": "Brief explanation focused on NCERT concepts",
                "subject": "Physics/Chemistry/Biology (Infer from content)"
              }` 
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
        }
      });
      return safeJsonParse(response.text || '[]', []);
    }, []);
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
  },

  async getYoutubeVideoId(topic: string, subject?: string) {
    // 1. Try Local Hardcoded Fallbacks First (Zero latency, No AI dependency)
    const { getFallbackVideoId } = await import('../data/videoFallbacks');
    const localId = getFallbackVideoId(topic);
    if (localId) return localId;

    return handleGeminiCall(async () => {
      // Use Google Search to find working/embeddable YouTube IDs
      const prompt = `Find the MOST POPULAR and WORKING YouTube video ID for a full chapter NEET lecture on the topic: "${topic}" ${subject ? `(${subject})` : ''}. 
      Prefer videos from top channels like "Competition Wallah", "Unacademy NEET", or "Physics Wallah".
      The video MUST allow embedding. 
      Return ONLY the 11-character YouTube video ID. Do NOT include any other text or explanation. 
      Example: dQw4w9WgXcQ`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        tools: [{ googleSearch: {} }]
      });
      
      const id = response.text?.trim();
      // Extract first 11-char sequence that looks like a YT ID if there's noise
      const match = id?.match(/[a-zA-Z0-9_-]{11}/);
      const cleanId = match ? match[0] : null;

      if (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
          return cleanId;
      }
      return null;
    });
  }
};
