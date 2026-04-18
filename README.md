# NEET Prep Master - Source Code & Setup

This is a production-level NEET preparation application built with React, Vite, and Tailwind CSS. It features a complete test system, AI-powered analysis, and offline-first persistence.

## 🚀 Features
- **Smart Home Screen**: Daily random chapter recommendations + NEET countdown.
- **Adaptive Test Engine**: Minor (30 Qs) and Major (180 Qs) tests with real-time timers.
- **AI Doubt Solver**: Powered by Gemini AI for instant explanations and study plans.
- **Performance Analytics**: Detailed score tracking and weak topic identification.
- **My Library**: Star important questions and upload photo-based notes.
- **Offline First**: All data is saved locally for seamless study without internet.

## 📦 How to Build/Run
1. **Local Development**:
   - `npm install`
   - `npm run dev`
2. **PWA / Web App**:
   - `npm run build`
   - The `dist` folder contains the production-ready web files.
3. **Generate APK**:
   - This project is compatible with **Capacitor**.
   - Run: `npm install @capacitor/core @capacitor/cli @capacitor/android`
   - Run: `npx cap init`
   - Run: `npx cap add android`
   - Run: `npm run build && npx cap copy`
   - Open the `android` folder in Android Studio to build the signed APK (supports SDK 54+ ready logic).

## 🛠️ Customization
- **Chapters**: Located in `src/data/chapters.ts`. Edit this list to update the syllabus.
- **Styling**: Global colors are in `src/index.css` under the `@theme` block.
- **AI Integration**: Managed in `src/services/gemini.ts`.

## 🔐 Data Privacy
All user data (results, notes, settings) is stored locally in the browser's `localStorage`. No data is sent to external servers except for AI queries to Gemini.

---
Created for NEET Aspirants. Follow **mr.divakar00** for updates.
