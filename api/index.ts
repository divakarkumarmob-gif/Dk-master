import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import fs from 'fs-extra';
import admin from 'firebase-admin';
import cors from 'cors';

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
  } catch (error) {
    console.error('[FIREBASE] Admin failed:', error);
  }
}

const db = admin.firestore();
const app = express();

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
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// 2. Rate Limiting Middleware (50 AI requests per day)
const aiRateLimiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const uid = req.user.uid;
  const today = new Date().toISOString().split('T')[0];
  const limitRef = db.collection('user_limits').doc(`${uid}_${today}`);

  try {
    const doc = await limitRef.get();
    const currentCount = doc.exists ? (doc.data()?.count || 0) : 0;

    if (currentCount >= 50) {
      return res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'Daily limit of 50 AI requests reached.' 
      });
    }

    await limitRef.set({ count: currentCount + 1, date: today }, { merge: true });
    next();
  } catch (error) {
    next();
  }
};

const otps = new Map<string, { code: string; expiry: number }>();
const MEMORY_FILE = '/tmp/memory.json';
const MAX_ENTRIES = 1000;

if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeJsonSync(MEMORY_FILE, { entries: [] });
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/auth/send-otp', authMiddleware, async (req: AuthRequest, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(email, { code, expiry: Date.now() + 10 * 60 * 1000 });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.json({ success: true, message: 'OTP generated (Dev).', dev: true, code: code });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"NEET Prep" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verification Code',
      text: `Your code is: ${code}`
    });
    res.json({ success: true, message: 'OTP sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Mail error.' });
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

app.post('/api/ask', authMiddleware, aiRateLimiter, async (req: AuthRequest, res) => {
  const { question } = req.body;
  let memory = { entries: [] };
  try { memory = await fs.readJson(MEMORY_FILE); } catch(e) {}
  
  const existing = memory.entries.find((e: any) => e.question.toLowerCase() === question.toLowerCase());
  if (existing) return res.json({ answer: existing.answer, cached: true });

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: question,
        config: {
          systemInstruction: "You are NEET Prep AI, the ultimate expert educator for NEET aspirants. You have absolute mastery over the NCERT syllabus for Physics, Chemistry, and Biology. \n\n" +
                             "YOUR STYLE:\n" +
                             "- Provide high-level, accurate, and technically sound answers.\n" +
                             "- Use clear step-by-step reasoning for numerical and logical problems.\n" +
                             "- Incorporate NCERT-specific keywords and concepts.\n" +
                             "- Be authoritative but deeply encouraging, like a top-tier kota faculty.\n" +
                             "- Format answers with clean markdown (bolding, lists) for readability.\n\n" +
                             "SPECIAL DUTY:\n" +
                             "- If a student asks a conceptual doubt, explain the 'Why' behind it.\n" +
                             "- For Bio, correlate with diagrams and real-word medical examples.\n" +
                             "- For Physics/Chem, emphasize unit mastery and mechanism logic."
        }
    });
    const answer = result.text || 'No answer generated';

    const newEntry = { question, answer, timestamp: new Date().toISOString(), usageCount: 1 };
    if (memory.entries.length >= MAX_ENTRIES) memory.entries.shift();
    memory.entries.push(newEntry);
    await fs.writeJson(MEMORY_FILE, memory);

    res.json({ answer, cached: false });
  } catch (error) {
    res.status(500).json({ error: 'AI Error' });
  }
});

export default app;
