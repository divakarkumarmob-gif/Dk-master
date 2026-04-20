# 📱 StudyMaster Mobile App (APK) Guide

Your app is now a fully functional **Progressive Web App (PWA)**. This means it can be installed on any Android or iOS device directly from the browser, and it will behave like a native app.

## 1. How to use PWA Builder to generate an APK

If you want a real `.apk` file to upload to the Google Play Store, follow these steps:

1.  **Deploy your app**: Ensure your latest changes are deployed to Vercel or your hosting provider.
2.  **Go to PWA Builder**: Open [pwabuilder.com](https://www.pwabuilder.com/).
3.  **Enter your URL**: Paste your live website URL (e.g., `https://studymaster.com`).
4.  **Review Report**: PWA Builder will check your `manifest.json` and Service Worker. (We have already set these up for you!).
5.  **Generate Package**: Click on **"Build & Generate"**.
6.  **Download Android Package**: Choose the **Android** option. It will generate a `.zip` file containing your `.apk` (for testing) and `.aab` (for Play Store).

## 2. Benefits of PWA over traditional APK

*   **No Play Store Fees**: You don't need a $25 developer account to share your app.
*   **Instant Updates**: Whenever you push code to GitHub, your users get the update instantly without downloading a new APK.
*   **Low Storage**: PWAs take up very little space on the phone.

## 3. How to Install Manually (Browser)

1.  Open your website in **Google Chrome** on Android.
2.  Wait for the **"Install StudyMaster"** banner at the bottom (we added a custom one!).
3.  Click **INSTALL**.
4.  The app will appear in your app drawer with the StudyMaster icon.

## 4. Play Store Readiness

To make it Play Store ready:
*   The `.aab` file from PWA Builder is what you upload to the Google Play Console.
*   Ensure your icons (in `public/manifest.json`) are high quality.
*   We've included `purpose: "any maskable"` in the manifest, which ensures your icon looks great on all Android versions.

---

### Internal Checks
- [x] **Firebase**: Authentication and Firestore are optimized for PWA.
- [x] **Gemini**: API calls will work perfectly as they are proxied through your server.
- [x] **Offline**: Basic assets are cached for faster loading.
