import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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

const db = getFirestore(undefined, process.env.VITE_FIREBASE_DATABASE_ID || undefined);
const app = express();
const PORT = 3000;

// Firebase Health Check Helper
const isFirebaseReady = (): boolean => {
  return admin.apps.length > 0;
};

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

// Utilities
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, data || '')
};

const sendError = (res: Response, status: number, message: string, code?: string) => {
  return res.status(status).json({
    success: false,
    error: message,
    code: code || 'INTERNAL_ERROR'
  });
};

const sanitizeInput = (input: any, maxLength: number = 2000): string => {
  if (typeof input !== 'string') return '';
  // Basic trim and length limit
  let cleaned = input.trim().substring(0, maxLength);
  // Remove potential sensitive/harmful character sequences if needed
  // For prompt injection, we mainly want to ensure it doesn't look like a command override
  // But a length limit and basic string cleaning is the first line of defense.
  return cleaned;
};

// 1. Firebase Auth Token Verification Middleware
interface AuthRequest extends Request {
  user?: { uid: string; email?: string; admin?: boolean };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Case 1: No token provided - Allow as guest (if your app design supports it)
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    req.user = { uid: `guest_${ip}` };
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  // Case 2: Firebase Admin not ready
  if (!admin.apps.length) {
    logger.error('Firebase Admin not initialized');
    return sendError(res, 500, 'Authentication service unavailable', 'FIREBASE_INIT_ERROR');
  }

  try {
    // Case 3: Verify the token strictly
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    logger.warn(`Token verification failed: ${error.message}`);
    return sendError(res, 401, 'Invalid or expired authentication token. Please log in again.', 'UNAUTHORIZED');
  }
};

// Admin Protection Middleware
const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
  
  if (!isFirebaseReady()) {
    logger.error('Admin check failed: Firebase not ready');
    return sendError(res, 503, 'Security service temporarily unavailable', 'SERVICE_UNAVAILABLE');
  }

  try {
    const adminDoc = await db.collection('admins').doc(req.user.uid).get();
    if (req.user.admin || adminDoc.exists) {
      next();
    } else {
      sendError(res, 403, 'Forbidden: Admin access required', 'FORBIDDEN');
    }
  } catch (err) {
    logger.error('Admin middleware check failed', err);
    sendError(res, 500, 'Failed to verify admin status');
  }
};

// 2. Cooldown and Rate Limiting Helper (Redis Optimized)
async function checkCooldownAndRateLimit(uid: string, res: Response): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `quota:${uid}:${today}`;
  const cooldownKey = `cooldown:${uid}`;

  try {
    // 1. Cooldown check (5 seconds between requests)
    const onCooldown = await redis.get(cooldownKey);
    if (onCooldown) {
      res.status(429).json({ error: 'Please wait a few seconds before asking another question.' });
      return false;
    }

    // 2. Quota check (Daily limit: 50)
    // INCR returns the new value. If it's 1, it means the key was just created.
    const currentCount = await redis.incr(quotaKey);
    
    // Set expiry to 24 hours if it's a new entry
    if (currentCount === 1) {
      await redis.expire(quotaKey, 86400);
    }

    if (currentCount > 50) {
      res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'Daily limit of 50 AI requests reached. Please try again tomorrow.' 
      });
      return false;
    }

    // 3. Set cooldown for 5 seconds
    await redis.set(cooldownKey, "1", { ex: 5 });

    return true;
  } catch (error) {
    console.error('[LIMIT] Redis rate limit check failed:', error);
    // Fail safe: If Redis is down, allow the request but log the error
    return true;
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
const ALLOWED_MODELS = ['gemini-3-flash-preview', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];

const aiKey = process.env.GEMINI_API_KEY;
if (!aiKey) {
  logger.error('CRITICAL: GEMINI_API_KEY is not defined in the environment.');
}
const ai = new GoogleGenAI({ apiKey: aiKey || '' });

// Auth endpoints - Open (no authMiddleware required since they are used for pre-register)
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, 'Email required', 'BAD_REQUEST');

  // 1. Cooldown for OTP (Redis)
  const otpCooldownKey = `otp_cooldown:${email}`;
  const isCooldown = await redis.get(otpCooldownKey);
  if (isCooldown) {
     return sendError(res, 429, 'Please wait 60 seconds before requesting another OTP.', 'RATE_LIMIT');
  }

  // 2. Generate OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 3. Store in Redis (TTL: 10 minutes)
  const otpStoreKey = `otp_store:${email}`;
  await redis.set(otpStoreKey, code, { ex: 600 });
  
  // 4. Set anti-spam cooldown (TTL: 60 seconds)
  await redis.set(otpCooldownKey, "1", { ex: 60 });

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
    logger.error('Mail server error details:', error);
    // Cleanup cooldown if email sending failed to allow retry
    await redis.del(otpCooldownKey);
    sendError(res, 500, 'Mail server error: ' + (error.message || 'Unknown error.'));
  }
});

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  const { email, code } = req.body;
  
  if (!email || !code) return sendError(res, 400, 'Email and OTP code required', 'BAD_REQUEST');

  const otpStoreKey = `otp_store:${email}`;
  const storedCode = await redis.get<string>(otpStoreKey);

  if (storedCode && storedCode === code) {
    // Delete OTP after successful verification to prevent reuse
    await redis.del(otpStoreKey);
    return res.json({ success: true });
  }
  
  sendError(res, 400, 'Invalid or expired OTP.', 'INVALID_OTP');
});

// AI and YouTube endpoints - Protected by Auth
app.post('/api/youtube-search', authMiddleware, async (req: AuthRequest, res) => {
  let { topic } = req.body;
  topic = sanitizeInput(topic, 200);
  if (!topic) return sendError(res, 400, 'Topic required', 'BAD_REQUEST');

  // Priority 1: Real YouTube Search (Bypassing AI Hallucinations)
  try {
      const searchPromise = ytSearch({ query: `${topic} NEET full lecture`, category: 'education' });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      
      const r = await Promise.race([searchPromise, timeoutPromise]) as ytSearch.SearchResult;
      
      if (r && r.videos && r.videos.length > 0) {
          const bestVideo = r.videos[0];
          const blockedAuthors = ['pw', 'physics wallah', 'lakshya', 'unacademy', 'vedantu', 'aakash', 'byju'];
          const authorName = (bestVideo.author?.name || '').toLowerCase();
          const isBlocked = blockedAuthors.some(blocked => authorName.includes(blocked));
          
          return res.json({ success: true, id: bestVideo.videoId, source: 'yt-search', blocked: isBlocked, title: bestVideo.title });
      }
  } catch (e) {
      logger.warn('yt-search failed or timed out:', e);
  }

  return sendError(res, 404, 'All engines failed to find a valid real ID.', 'NOT_FOUND');
});

// AI Route - Protected by Auth
app.post('/api/ai/generate', authMiddleware, async (req: AuthRequest, res) => {
  let { prompt, systemInstruction, model = 'gemini-3-flash-preview', responseMimeType } = req.body;
  
  prompt = sanitizeInput(prompt, 5000); // Higher limit for prompts
  systemInstruction = sanitizeInput(systemInstruction, 2000);
  
  if (!prompt) return sendError(res, 400, 'Prompt required', 'BAD_REQUEST');
  if (!req.user) return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');

  // Point 2 Fix: Model Allowlist Validation
  if (!ALLOWED_MODELS.includes(model)) {
    logger.warn(`Unauthorized model requested: ${model}. Falling back to default.`);
    model = 'gemini-3-flash-preview';
  }
  
  const uid = req.user.uid;
  if (!process.env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY missing on server');
    return sendError(res, 500, 'AI Configuration Error', 'CONFIG_ERROR');
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
    res.json({ success: true, text: result.text });
  } catch (error: any) {
    logger.error(`AI Generation failed for user ${uid}: ${error.message}`);
    sendError(res, 500, error.message || 'AI Generation failed');
  }
});

// AI Image Analysis - Protected by Auth
app.post('/api/ai/analyze-image', authMiddleware, async (req: AuthRequest, res) => {
    const { image, prompt, systemInstruction } = req.body;
    if (!image) return sendError(res, 400, 'Image required', 'BAD_REQUEST');
    if (!req.user) return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');

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
        res.json({ success: true, text: result.text });
    } catch (error: any) {
        logger.error(`Image analysis failed for user ${uid}: ${error.message}`);
        sendError(res, 500, error.message || 'Image analysis failed');
    }
});

// AI Route - Protected by Auth
app.post('/api/ask', authMiddleware, async (req: AuthRequest, res) => {
  let { question } = req.body;
  question = sanitizeInput(question, 1000);
  if (!question) return sendError(res, 400, 'Question required', 'BAD_REQUEST');
  if (!req.user) return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
  const uid = req.user.uid;

  const normalizedQ = normalizeQuestion(question);
  const keywords = extractKeywords(normalizedQ);
  
  // 1. Upstash Redis (Fast Layer, TTL: 24h)
  const redisKey = `aimem:${normalizedQ.replace(/\s+/g, '_')}`;
  try {
    const cachedAns = await redis.get<string>(redisKey);
    if (cachedAns) {
      return res.json({ success: true, answer: cachedAns, cached: true, source: 'redis' });
    }
  } catch (err) {
    logger.warn(`Redis cache check failed: ${err}`);
  }

  // 2. Firestore memory check
  // Scalable similarity: search by prioritizing long/unique keywords
  let foundMatch = null;
  let matchDocRef = null;
  
  if (isFirebaseReady()) {
    try {
      if (keywords.length > 0) {
        // Prioritize longest keywords as they are more likely to be unique/specific
        const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
        const queryKeywords = sortedKeywords.slice(0, 10);

        const snapshot = await db.collection('ai_memory')
          .where('keywords', 'array-contains-any', queryKeywords)
          .limit(30) // Increased limit slightly for better matching pool
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

          // Similarity threshold (75% match is generally safe for short technical answers)
          if (bestMatch.score > 0.75) {
            foundMatch = bestMatch.answer;
            matchDocRef = db.collection('ai_memory').doc(bestMatch.docId);
          }
        }
      }
    } catch (err) {
      logger.error('[MEMORY] Firestore retrieval failed:', err);
      // Fallback to AI if Firestore fails
    }
  } else {
    logger.warn('AI Memory search skipped: Firebase not initialized');
  }

  if (foundMatch) {
    // Increment usage and track last used time
    if (matchDocRef) {
      matchDocRef.update({ 
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(err => console.error('[MEMORY] Update failed:', err));
    }
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
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 1,
    }).catch(console.error);

    // Store in Redis (24h TTL)
    redis.set(redisKey, answer, { ex: 86400 }).catch(console.error);

    res.json({ answer, cached: false });
});

// Admin Only Route
app.get('/api/memory', authMiddleware, adminMiddleware, async (req, res) => {
  if (!isFirebaseReady()) return sendError(res, 503, 'Database unavailable');
  try {
    const snapshot = await db.collection('ai_memory').get();
    res.json({ success: true, count: snapshot.size });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch memory count');
  }
});

app.post('/api/export', authMiddleware, adminMiddleware, async (req, res) => {
  if (!isFirebaseReady()) return sendError(res, 503, 'Database unavailable');
  try {
    const snapshot = await db.collection('ai_memory').get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(entries);
  } catch (error) {
    sendError(res, 500, 'Failed to export memory');
  }
});

async function startServer() {
  console.log('[SERVER] Starting with NODE_ENV:', process.env.NODE_ENV);
  
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.log('[SERVER] Running in DEVELOPMENT mode with Vite middleware');
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: 'spa' 
    });
    
    // Middleware to catch static assets
    app.use(vite.middlewares);

    // SPA Fallback for Development
    app.get('*all', async (req, res, next) => {
      // If it's an API request that reached here, don't serve HTML
      if (req.url.startsWith('/api')) return next();
      
      const url = req.originalUrl;
      try {
        const indexPath = path.join(process.cwd(), 'index.html');
        if (await fs.pathExists(indexPath)) {
          let template = await fs.readFile(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          res.status(404).send('index.html not found');
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log('[SERVER] Running in PRODUCTION mode');
    const distPath = path.join(process.cwd(), 'dist');
    if (await fs.pathExists(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    } else {
      console.error('[SERVER] CRITICAL: "dist" directory not found in production mode!');
      // Fallback to Vite even in production mode if dist is missing (emergency recovery for AI Studio)
      console.log('[SERVER] Falling back to Vite middleware for recovery...');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
      
      app.get('*all', async (req, res, next) => {
        if (req.url.startsWith('/api')) return next();
        const url = req.originalUrl;
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          let template = await fs.readFile(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          next(e);
        }
      });
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer();
