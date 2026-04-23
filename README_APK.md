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

## White Screen Troubleshooting
Agar APK install karne ke baad white screen dikh rahi hai, to iske piche 2 bade kaaran ho sakte hain:

1. **Missing Variables**: GitHub Actions build ke waqt Firebase ke keys load nahi hote. 
   - **Solution**: Apne GitHub Repo mein **Settings > Secrets and variables > Actions** mein jayein aur niche diye gaye Secrets add karein:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_APP_ID`
     - `GEMINI_API_KEY`
     - `VITE_API_BASE_URL` (Aapki Vercel URL)

2. **Older Android Version**: Agar aapka phone purana hai, to shayad "Legacy Plugin" ki zaroorat ho.
   - Maine code mein **Legacy Browser Support** add kar diya hai, jo purane phones par bhi app chalayega.

3. **Debug Mode**: Maine APK mein ek "Error Overlay" dala hai. Agar ab white screen aati hai, to waha ek **Red ya Blue box** mein error message dikhega. Uska screenshot le kar mujhe batayein.

## GitHub Actions se APK kaise download karein:
1. Is project ko GitHub par **Export** karein.
2. GitHub par apne repo ke **Actions** tab mein jayein.
3. **Build Android APK** workflow par click karein.
4. Jab build complete ho jaye (Green checkmark), tab niche **Artifacts** section mein `app-debug` zip file download karein.
5. Usko extract karke APK install karein.
