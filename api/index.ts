import express from 'express';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import fs from 'fs-extra';
import path from 'path';

const app = express();
app.use(express.json());

const otps = new Map<string, { code: string; expiry: number }>();
const MEMORY_FILE = '/tmp/memory.json';
const MAX_ENTRIES = 1000;

// Initialize memory in /tmp (Vercel serverless has /tmp as writable)
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeJsonSync(MEMORY_FILE, { entries: [] });
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/auth/send-otp', async (req, res) => {
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
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid or expired OTP.' });
});

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  let memory = { entries: [] };
  try { memory = await fs.readJson(MEMORY_FILE); } catch(e) {}
  
  const existing = memory.entries.find((e: any) => e.question.toLowerCase() === question.toLowerCase());
  if (existing) return res.json({ answer: existing.answer, cached: true });

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: question
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
