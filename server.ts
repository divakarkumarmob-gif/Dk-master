import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import cors from 'cors';
import { Redis } from '@upstash/redis';
import stringSimilarity from 'string-similarity';
import ytSearch from 'yt-search';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : undefined;

    admin.initializeApp({
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
      databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('[FIREBASE] Admin initialized successfully');
  } catch (error) {
    console.error('[FIREBASE] Admin initialization failed:', error);
  }
}

const db = admin.firestore();
const app = express();
const PORT = 3000;

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// 3. CORS Protection
const allowedOrigins = ['https://dk-master.vercel.app'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.endsWith('.run.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 1. Firebase Auth Token Verification Middleware
interface AuthRequest extends Request {
  user?: { uid: string; email?: string; admin?: boolean };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Allow guest access if no token or undefined token is provided
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
    // Assign a guest UID based on IP to implement rate limiting for guests
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    req.user = { uid: `guest_${ip}` };
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  // If Firebase Admin is not fully initialized but they sent a token somehow (unlikely to be valid), just make them a guest.
  if (!admin.apps.length) {
    req.user = { uid: 'guest_no_firebase' };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    // Even if verification fails, fallback to guest so the AI continues to work
    req.user = { uid: 'guest_invalid_token' };
    next();
  }
};

// Admin Protection Middleware
const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Example: Check for custom claim or presence in 'admins' collection
  const adminDoc = await db.collection('admins').doc(req.user.uid).get();
  if (req.user.admin || adminDoc.exists) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

// 2. Cooldown and Rate Limiting Helper
async function checkCooldownAndRateLimit(uid: string, res: Response): Promise<boolean> {
  // Cooldown check (Redis)
  const cooldownKey = `cooldown:${uid}`;
  const isCooldown = await redis.set(cooldownKey, "1", { ex: 5, nx: true });
  if (!isCooldown) {
    res.status(429).json({ error: 'Please wait a few seconds before asking another question.' });
    return false;
  }

  // Quota check (Firestore)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const limitRef = db.collection('user_limits').doc(`${uid}_${today}`);
  try {
    const doc = await limitRef.get();
    const currentCount = doc.exists ? (doc.data()?.count || 0) : 0;
    if (currentCount >= 50) {
      res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'Daily limit of 50 AI requests reached. Please try again tomorrow.' 
      });
      return false;
    }
    await limitRef.set({ count: currentCount + 1, date: today }, { merge: true });
    return true;
  } catch (error) {
    console.error('[LIMIT] Rate limit check failed:', error);
    return true; // Proceed if DB fails
  }
}

// Memory Utilities
function normalizeQuestion(q: string) {
  return q.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, ' ');
}

function extractKeywords(q: string) {
  const stops = new Set(['what', 'is', 'the', 'a', 'to', 'how', 'do', 'in', 'of', 'and', 'explain', 'describe']);
  return normalizeQuestion(q).split(' ').filter(w => w.length > 2 && !stops.has(w));
}

// Application Logic
const otps = new Map<string, { code: string; expiry: number }>();

const aiKey = process.env.GEMINI_API_KEY;
if (!aiKey) {
  console.error('[AI] CRITICAL: GEMINI_API_KEY is not defined in the environment.');
}
const ai = new GoogleGenAI({ apiKey: aiKey || '' });

// Auth endpoints - Open (no authMiddleware required since they are used for pre-register)
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Basic rate limited locally for OTP (if redis is active)
  const otpCooldownKey = `otp_cooldown:${email}`;
  const isCooldown = await redis.set(otpCooldownKey, "1", { ex: 60, nx: true }); // 60 sec wait between sends
  if (!isCooldown) {
     return res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(email, { code, expiry: Date.now() + 10 * 60 * 1000 });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.json({ 
      success: true, 
      message: 'OTP generated (Developer Mode).', 
      dev: true,
      code: code 
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"NEET Prep" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verification Code for NEET Prep',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: `<div style="text-align: center;"><h2>${code}</h2></div>`
    });
    res.json({ success: true, message: 'OTP sent to your Gmail.' });
  } catch (error: any) {
    console.error('Mail server error details:', error);
    // Allow trying again without waiting 60s if it completely failed.
    redis.del(otpCooldownKey);
    res.status(500).json({ error: 'Mail server error: ' + (error.message || 'Unknown error. Are you using an App Password?') });
  }
});

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const stored = otps.get(email);
  if (stored && stored.code === code && stored.expiry > Date.now()) {
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid or expired OTP.' });
});

// AI and YouTube endpoints - Protected by Auth
app.post('/api/youtube-search', authMiddleware, async (req: AuthRequest, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  // Priority 1: Real YouTube Search (Bypassing AI Hallucinations)
  // AI models like OpenAI and Gemini hallucinate 11-character strings without direct LIVE web browsing APIs.
  // Using yt-search fetches the absolute top-ranked video dynamically directly from YouTube within 1-2 seconds.
  try {
      // Race condition to enforce max 4 second limit
      const searchPromise = ytSearch({ query: `${topic} NEET full lecture`, category: 'education' });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      
      const r = await Promise.race([searchPromise, timeoutPromise]) as ytSearch.SearchResult;
      
      if (r && r.videos && r.videos.length > 0) {
          const bestVideo = r.videos[0]; // ALWAYS pick the absolute top video
          
          // Check if this channel is known to block iframes
          const blockedAuthors = ['pw', 'physics wallah', 'lakshya', 'unacademy', 'vedantu', 'aakash', 'byju'];
          const authorName = (bestVideo.author?.name || '').toLowerCase();
          const isBlocked = blockedAuthors.some(blocked => authorName.includes(blocked));
          
          return res.json({ id: bestVideo.videoId, source: 'yt-search', blocked: isBlocked, title: bestVideo.title });
      }
  } catch (e) {
      console.error('[AI] yt-search failed or timed out:', e);
  }

  // Priority 2: Fail fast to let client redirect to UI search
  return res.status(404).json({ error: 'All engines failed to find a valid real ID.' });
});

app.post('/api/auth/verify-otp', authMiddleware, async (req: AuthRequest, res) => {
  const { email, code } = req.body;
  const stored = otps.get(email);
  if (stored && stored.code === code && stored.expiry > Date.now()) {
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid or expired OTP.' });
});

// AI Route - Protected by Auth
app.post('/api/ai/generate', authMiddleware, async (req: AuthRequest, res) => {
  const { prompt, systemInstruction, model = 'gemini-3-flash-preview', responseMimeType } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const uid = req.user.uid;
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing on server' });
  }

  // Rate limit
  const allowed = await checkCooldownAndRateLimit(uid, res as any);
  if (!allowed) return;

  try {
    const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
          systemInstruction: systemInstruction || undefined,
          responseMimeType: responseMimeType || undefined
        }
    });
    res.json({ text: result.text });
  } catch (error: any) {
    console.error('[AI] Generation failed:', error);
    res.status(500).json({ error: error.message || 'AI Generation failed' });
  }
});

// AI Image Analysis - Protected by Auth
app.post('/api/ai/analyze-image', authMiddleware, async (req: AuthRequest, res) => {
    const { image, prompt, systemInstruction } = req.body;
    if (!image) return res.status(400).json({ error: 'Image required' });
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const uid = req.user.uid;
    const allowed = await checkCooldownAndRateLimit(uid, res as any);
    if (!allowed) return;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { inlineData: { data: image.split(',')[1] || image, mimeType: "image/png" } },
                { text: prompt || "Analyze this for a NEET student." }
            ],
            config: { systemInstruction: systemInstruction || undefined }
        });
        res.json({ text: result.text });
    } catch (error: any) {
        console.error('[AI] Image analysis failed:', error);
        res.status(500).json({ error: error.message || 'Image analysis failed' });
    }
});

// AI Route - Protected by Auth
app.post('/api/ask', authMiddleware, async (req: AuthRequest, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question required' });
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const uid = req.user.uid;

  const normalizedQ = normalizeQuestion(question);
  const keywords = extractKeywords(normalizedQ);
  
  // 1. Upstash Redis (Fast Layer, TTL: 24h)
  const redisKey = `aimem:${normalizedQ.replace(/\s+/g, '_')}`;
  try {
    const cachedAns = await redis.get<string>(redisKey);
    if (cachedAns) {
      return res.json({ answer: cachedAns, cached: true, source: 'redis' });
    }
  } catch (err) {
    console.error('Redis check failed:', err);
  }

  // 2. Firestore memory check
  // Basic similarity: search by keywords
  let foundMatch = null;
  let matchDocRef = null;
  try {
    if (keywords.length > 0) {
      // Query up to 10 docs matching any keyword to perform local similarity check
      const snapshot = await db.collection('ai_memory')
        .where('keywords', 'array-contains-any', keywords.slice(0, 10))
        .limit(20)
        .get();
        
      if (!snapshot.empty) {
        let bestMatch = { docId: '', answer: '', score: 0 };
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const score = stringSimilarity.compareTwoStrings(normalizedQ, data.normalizedQuestion || '');
          if (score > bestMatch.score) {
            bestMatch = { docId: doc.id, answer: data.answer, score };
          }
        });

        // Similarity threshold (e.g. 75% match)
        if (bestMatch.score > 0.75) {
          foundMatch = bestMatch.answer;
          matchDocRef = db.collection('ai_memory').doc(bestMatch.docId);
        }
      }
    }
  } catch (err) {
    console.error('Firestore memory check failed:', err);
  }

  if (foundMatch) {
    // Increment usage
    if (matchDocRef) matchDocRef.update({ usageCount: admin.firestore.FieldValue.increment(1) }).catch(console.error);
    // Store in Redis for future (TTL 24h)
    redis.set(redisKey, foundMatch, { ex: 86400 }).catch(console.error);
    return res.json({ answer: foundMatch, cached: true, source: 'firestore' });
  }

  // --- CACHE MISS: CALL AI ---
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI Configuration Error: Missing API Key on server.' });
  }

  // Apply abuse/rate limit ONLY here
  const allowed = await checkCooldownAndRateLimit(uid, res as any);
  if (!allowed) return; // response already sent

  const systemInstruction = "You are NEET Prep AI, the ultimate expert educator for NEET aspirants. You have absolute mastery over the NCERT syllabus for Physics, Chemistry, and Biology. \n\n" +
  "YOUR STYLE:\n" +
  "- Provide high-level, accurate, and technically sound answers.\n" +
  "- Keep answers SHORT (3-5 lines max). Be extremely concise to minimize costs.\n" + 
  "- Use clear step-by-step reasoning for numerical and logical problems.\n" +
  "- Incorporate NCERT-specific keywords and concepts.\n" +
  "- Be authoritative but deeply encouraging.\n" +
  "- Format answers with clean markdown (bolding, lists) for readability.";

  let answer = "";
  try {
    const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: question,
        config: { systemInstruction }
    });

    if (!result) throw new Error("AI engine failed to produce response object");

    try {
        answer = result.text;
    } catch (e) {
        if (result.candidates && result.candidates.length > 0) {
            answer = result.candidates[0].content?.parts?.[0]?.text || "Response blocked by safety filters.";
        } else {
            answer = "I'm sorry, I couldn't generate a safe response. Please try rephrasing your doubt.";
        }
    }
  } catch (error) {
    console.error('[AI] Gemini failed, attempting OpenAI fallback:', error);
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'AI engines failed and no OpenAI fallback configured.' });
    }
    try {
        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: question }
                ],
                max_tokens: 300
            })
        });
        const oaiData = await oaiRes.json();
        if (oaiData.choices && oaiData.choices.length > 0) {
            answer = oaiData.choices[0].message.content;
            console.log('[AI] Successfully used OpenAI fallback.');
        } else {
            throw new Error('OpenAI returned invalid format.');
        }
    } catch (oaiError) {
        console.error('[AI] OpenAI fallback failed:', oaiError);
        return res.status(500).json({ error: 'All AI engines failed. Neural Link offline.' });
    }
  }

  if (!answer) {
      return res.status(200).json({ answer: "Neural Link timed out. Practice NCERT while we re-sync." });
  }

  // Store in Firestore memory
    db.collection('ai_memory').add({
      originalQuestion: question,
      normalizedQuestion: normalizedQ,
      keywords,
      answer,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 1,
    }).catch(console.error);

    // Store in Redis (24h TTL)
    redis.set(redisKey, answer, { ex: 86400 }).catch(console.error);

    res.json({ answer, cached: false });
});

// Admin Only Route
app.get('/api/memory', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('ai_memory').get();
    res.json({ count: snapshot.size });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memory count' });
  }
});

app.post('/api/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('ai_memory').get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export memory' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*all', (req, res) => res.sendFile(path.join(process.cwd(), 'dist/index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer();
