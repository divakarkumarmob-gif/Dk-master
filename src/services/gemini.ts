import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUESTIONS } from "../constants/fallbackData";
import { db, auth } from "./firebase";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const handleGeminiCall = async <T>(fn: () => Promise<T>, fallback: T, cacheKey?: string): Promise<T> => {
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
    if (data === undefined || data === null) return fallback;
    
    if (cacheKey) {
      localStorage.setItem(`gemini_cache_${cacheKey}`, JSON.stringify({ data, timestamp: Date.now() }));
    }
    return data;
  } catch (error: any) {
    console.error("Gemini/Server API Error:", error);
    
    const errorMsg = error?.message || "";
    if (errorMsg.includes('Server Error (401)') || errorMsg.includes('Unauthorized: Missing or invalid token')) {
      console.error("CRITICAL: User Session Expired or Auth Header Missing.");
    } else if (error?.status === 401 || errorMsg.includes('Unauthorized')) {
      console.error("CRITICAL: Invalid Gemini API Key.");
    }
    
    return fallback;
  }
};

const validateQuestion = (q: any): any => {
  if (!q || typeof q !== 'object') return null;
  const text = q.text || q.question || "Neural Data Link...";
  const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Data Locked", "Analysis Fail", "Core Syncing", "Retry Link"];
  const correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.answer === 'number' ? q.answer : 0);
  const explanation = q.explanation || "Authentication of data source in progress. Refer to NCERT.";
  
  return {
    ...q,
    text,
    question: text, // Backward compatibility
    options,
    correctAnswer,
    explanation,
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`
  };
};

export const safeJsonParse = (text: string | null | undefined, fallback: any = []) => {
    if (!text) return fallback;
    try {
        // Remove markdown code blocks if present
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        if (Array.isArray(parsed)) {
          return parsed.map(validateQuestion).filter(Boolean);
        }
        
        return parsed;
    } catch (e) {
        console.error("JSON Parse Error:", e, "Raw text:", text);
        // Try to extract JSON array if initial parse failed
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
           return safeJsonParse(match[0], fallback);
        }
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

      if (!response) throw new Error("No response from AI");
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

      if (!response) throw new Error("No response from AI");
      return safeJsonParse(response.text || '[]', FALLBACK_QUESTIONS);
    }, FALLBACK_QUESTIONS);
  },

  async solveDoubt(doubt: string, context?: string, imageData?: { data: string, mimeType: string }) {
    if (!doubt && !imageData) return "Protocol Error: No input detected.";
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
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              if (data && data.answer) return data.answer;
            }
        } catch(e) {
            console.error("Memory search failed:", e);
        }
      }
    }

    // 2. Ask AI
    const answer = await handleGeminiCall(async () => {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Unauthorized: User not signed in");

        const result = await fetch('/api/ask', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ question: doubt, image: imageData })
        });
        
        if (!result.ok) {
            const errorText = await result.text().catch(() => "Unknown Connection Fail");
            throw new Error(`Server Error (${result.status}): ${errorText}`);
        }
        
        const contentType = result.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await result.json();
            return data.answer || "Processing anomaly: AI returned empty response.";
        } else {
            const text = await result.text();
            return text || "Neural link stable but silent. Retry protocol.";
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
      return response?.text || "No analysis available.";
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
      if (!response) throw new Error("No response from AI");
      return safeJsonParse(response.text || '[]', []);
    }, []);
  },

  async summarizeResponse(text: string | null | undefined): Promise<string> {
    if (!text) return "Insufficient data for summary.";
    return handleGeminiCall(async () => {
      const prompt = `Summarize: ${text}. Plain text only.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response?.text || text.substring(0, 100) + "...";
    }, text.substring(0, 100) + "...");
  },

  async getStudyPlan(performanceData: string) {
    return handleGeminiCall(async () => {
      const prompt = `Study plan based on: ${performanceData}. Plain text.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response?.text || "Unable to generate study plan.";
    }, "Focus on NCERT Biology diagrams and Physics formulas for the next 7 days. Keep practicing!");
  },

  async getYoutubeVideoId(topic: string, subject?: string) {
    // 1. Try Local Hardcoded Fallbacks First (Zero latency, No AI dependency)
    const { getFallbackVideoId } = await import('../data/videoFallbacks');
    const localId = getFallbackVideoId(topic);
    if (localId) return localId;

    return handleGeminiCall(async () => {
      // Use Google Search grounding to find real, embeddable YouTube IDs
      const prompt = `Use Google Search to find the exact YouTube video ID for a high-quality, full NCERT lecture on: "${topic}" ${subject ? `(${subject})` : ''}.
      
      REQUIREMENTS:
      1. Channels: Look for "Physics Wallah", "Unacademy NEET", "Aakash by BYJU'S", or "Competition Wallah".
      2. Status: The video MUST be embeddable and currently available (not deleted).
      3. Topic Match: Must match the chapter name: ${topic}.
      
      Return ONLY the 11-character YouTube video ID. No other text.`;
      
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] 
        }
      });
      
      if (!response) throw new Error("No response from AI");
      const id = response.text?.trim();
      // Extract first 11-char sequence if there's noise
      const match = id?.match(/[a-zA-Z0-9_-]{11}/);
      const cleanId = match ? match[0] : null;

      if (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
          return cleanId;
      }
      return null;
    }, null);
  }
};
