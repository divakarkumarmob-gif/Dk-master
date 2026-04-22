# 📱 StudyMaster Mobile App (APK) Guide

StudyMaster is now an optimized **Progressive Web App (PWA)**, making it ready for the Google Play Store as a high-performance native-like app.

## 🚀 1. How to generate your APK / Play Store Package

1.  **Deploy changes**: Push your latest code to GitHub and ensure Vercel has updated your live site.
2.  **Logo Upload**: Replace the file `public/logo.png` with your actual high-quality logo image.
3.  **Go to PWA Builder**: Open [pwabuilder.com](https://www.pwabuilder.com/).
4.  **Enter your URL**: Paste your live website URL (e.g., `https://studymaster.vercel.app`).
5.  **Review the Report**: 
    *   **Manifest**: All fields (Education category, ID, description) are optimized.
    *   **Service Worker**: Offline fallback page is active.
6.  **Package for Store**: Click **"Build & Generate"**.
7.  **Android Selection**: Click on **Android**, then click **Download**.
8.  **Output**: You will get a `.zip` file.
    *   `assetlinks.json`: Upload this to your website's `.well-known/` folder (PWA Builder explains this).
    *   `.aab`: This is for the Google Play Store.
    *   `.apk`: This is for manual testing on your phone.

## ✨ 2. PWA Features implemented

*   **Custom Splash Screen**: A premium blue-purple gradient with your brand logo.
*   **Offline Support**: Custom `offline.html` fallback if internet is lost.
*   **Install Prompt**: Smart banner to help users install the app on their home screen.
*   **Standalone Mode**: No browser address bar; looks like a real Android app.
*   **Performance**: Asset caching via Service Worker for near-instant loading.

## 🛠️ 3. Play Store Readiness Checklist

- [x] **High-Res Icon**: Use a 512x512 logo.png in the public folder.
- [x] **Screenshots**: Update the screenshots in `manifest.json` with real app images.
- [x] **HTTPS**: Already handled by Vercel.
- [x] **Privacy Policy**: Mention AI (Gemini) usage in your Play Store description.

## 🤝 4. Support
If you face issues with PWA Builder, ensure your `manifest.json` is publicly accessible at `your-site.com/manifest.json`.
