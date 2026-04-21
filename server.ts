import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;
app.use(express.json());

// OTP Memory storage (In-memory for simplicity, resets on server restart)
const otps = new Map<string, { code: string; expiry: number }>();

const MEMORY_FILE = './memory.json';
const MAX_ENTRIES = 1000;

if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeJsonSync(MEMORY_FILE, { entries: [] });
}

// Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Endpoints
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(email, { code, expiry: Date.now() + 10 * 60 * 1000 }); // 10 mins

  // Developer Fallback: If no SMTP credentials, return OTP in response (for testing)
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn(`[AUTH] Credentials missing for ${email}. OTP is: ${code}`);
    return res.json({ 
      success: true, 
      message: 'OTP generated (Developer Mode). Check server logs or use the code below.', 
      dev: true,
      code: code // Including code in response ONLY when credentials are missing for easier development
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"NEET Prep" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verification Code for NEET Prep',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px; margin: auto; text-align: center;">
          <h2 style="color: #2563eb;">Verify Your Gmail</h2>
          <p>Welcome to NEET Prep! Use the code below to verify your account:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    res.json({ success: true, message: 'OTP has been sent to your Gmail.' });
  } catch (error: any) {
    console.error('Mail Error:', error);
    if (error.responseCode === 535) {
      return res.status(401).json({ 
        error: 'Invalid Gmail Login. Please use an "App Password" instead of your regular password in Settings -> Secrets.' 
      });
    }
    res.status(500).json({ error: 'Mail server error.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  const stored = otps.get(email);
  if (stored && stored.code === code && stored.expiry > Date.now()) {
    // Keep it in memory until registration is complete or use a verified flag
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
});

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  const memory = await fs.readJson(MEMORY_FILE);
  
  const existing = memory.entries.find((e: any) => e.question.toLowerCase() === question.toLowerCase());
  if (existing) {
    existing.usageCount = (existing.usageCount || 1) + 1;
    await fs.writeJson(MEMORY_FILE, memory);
    return res.json({ answer: existing.answer, cached: true });
  }

  // Call AI
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

app.get('/api/memory', async (req, res) => {
  const memory = await fs.readJson(MEMORY_FILE);
  res.json({ count: memory.entries.length, lastBackup: memory.entries.length > 0 ? memory.entries[memory.entries.length - 1].timestamp : null });
});

app.post('/api/export', async (req, res) => {
  const memory = await fs.readJson(MEMORY_FILE);
  res.json(memory.entries);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }
  
  app.listen(PORT, '0.0.0.0', () => console.log('Server running on port 3000'));
}
startServer();
