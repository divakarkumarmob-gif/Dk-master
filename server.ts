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
  user?: admin.auth.DecodedIdToken;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Token verification failed' });
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Endpoints - Protected by authMiddleware
app.post('/api/auth/send-otp', authMiddleware, async (req: AuthRequest, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

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
  } catch (error) {
    res.status(500).json({ error: 'Mail server error.' });
  }
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
  // Apply abuse/rate limit ONLY here
  const allowed = await checkCooldownAndRateLimit(uid, res as any);
  if (!allowed) return; // response already sent

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: question,
        config: {
          systemInstruction: "You are NEET Prep AI, the ultimate expert educator for NEET aspirants. You have absolute mastery over the NCERT syllabus for Physics, Chemistry, and Biology. \n\n" +
                             "YOUR STYLE:\n" +
                             "- Provide high-level, accurate, and technically sound answers.\n" +
                             "- Keep answers SHORT (3-5 lines max). Be extremely concise to minimize costs.\n" + 
                             "- Use clear step-by-step reasoning for numerical and logical problems.\n" +
                             "- Incorporate NCERT-specific keywords and concepts.\n" +
                             "- Be authoritative but deeply encouraging.\n" +
                             "- Format answers with clean markdown (bolding, lists) for readability."
        }
    });
    const answer = result.text || 'No answer generated';

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
  } catch (error) {
    console.error('AI error', error);
    res.status(500).json({ error: 'AI Error' });
  }
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
