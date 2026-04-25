import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
initializeApp();
const adminDb = getFirestore();
const adminAuth = getAuth();

// Email Transporter (Ensure EMAIL_USER and EMAIL_PASS are set in Firebase Config)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// OTP Storage (Firebase Functions are ephemeral, use Redis or Firestore for production OTP storage)
// For now, let's keep it simple or implement a temporary storage in Firestore
const otpStore = new Map<string, { code: string, expires: number }>();

// API Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 mins

    try {
        await transporter.sendMail({
            from: `"NEET PREP" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Neural Access Code: ${code}`,
            text: `Operative,\n\nYour neural access code is: ${code}\n\nEstablish connection within 10 minutes.\n\nNEET PREP HQ`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: white; border-radius: 20px; text-align: center;">
                    <h1 style="color: #f97316; margin-bottom: 0;">NEET PREP</h1>
                    <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px; opacity: 0.5;">Neural HQ Access</p>
                    <div style="margin: 40px 0; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 15px;">
                        <p style="margin-bottom: 10px; font-size: 12px;">OPERATIVE ACCESS CODE</p>
                        <h2 style="font-size: 40px; margin: 0; color: #f97316; letter-spacing: 5px;">${code}</h2>
                    </div>
                    <p style="font-size: 10px; color: #64748b;">NEURAL LINK EXPIRES IN 10 MINUTES</p>
                </div>
            `
        });
        res.json({ success: true, message: "OTP sent" });
    } catch (e: any) {
        console.error("Mail error:", e);
        res.status(500).json({ error: "Failed to send OTP", details: e.message });
    }
});

app.post("/auth/verify-otp", async (req, res) => {
    const { email, code } = req.body;
    const stored = otpStore.get(email);

    if (!stored || stored.code !== code || Date.now() > stored.expires) {
        return res.status(400).json({ error: "Invalid or expired code" });
    }

    const sessionToken = Math.random().toString(36).substring(7);
    otpStore.set(email, { code: "VERIFIED", sessionToken, expires: Date.now() + 5 * 60 * 1000 } as any);

    res.json({ success: true, sessionToken });
});

app.post("/auth/set-password", async (req, res) => {
    const { email, password, sessionToken } = req.body;
    const stored = otpStore.get(email);

    if (!stored || (stored as any).sessionToken !== sessionToken || stored.expires < Date.now()) {
        return res.status(401).json({ error: "Verification expired. Please restart process." });
    }

    try {
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
            await adminAuth.updateUser(userRecord.uid, { password });
        } catch {
            await adminAuth.createUser({ email, password, emailVerified: true });
        }

        otpStore.delete(email);
        res.json({ success: true, message: "Security Key updated successfully." });
    } catch (e: any) {
        console.error("Set password error:", e);
        res.status(500).json({ error: e.message || "Failed to update identity." });
    }
});

export const api = onRequest(app);
