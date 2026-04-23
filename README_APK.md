# NEET Prep Pro - Android APK Build Instructions

Aapne is app ko Android APK mein convert karne ke liye configuration set kar di hai. APK build karne ke liye niche diye gaye steps follow karein:

## Prerequisites
1. Apne computer par **Android Studio** install karein.
2. Apne project ko **Download** karein (AI Studio menu se ZIP download karein).

## APK Kaise Banayein (Steps):

1. **Project Extract Karein**: Downloaded ZIP file ko extract karein.
2. **Setup Dependencies**: Final build ke liye terminal mein ye command background mein chalayein:
   ```bash
   npm install
   npm run build
   npx cap sync
   ```
3. **Android Studio Open Karein**:
   - Android Studio open karein.
   - **"Open an Existing Project"** par click karein.
   - Apne project folder ke andar `/android` folder ko select karein.
4. **Build APK**:
   - Project load hone ke baad, top menu mein **Build > Build Bundle(s) / APK(s) > Build APK(s)** par jayein.
5. **APK Mil Jayega**: 
   - Android Studio niche right corner mein ek popup dikhayega "APK generated successfully".
   - **"locate"** par click karein, waha aapko `app-debug.apk` mil jayega.

## Important Note:
Maine code mein `VITE_API_BASE_URL` add kar diya hai. APK build karne se pehle `.env` file mein apni Vercel URL zaroori dalein taaki AI aur OTP feature APK mein bhi kaam karein.
