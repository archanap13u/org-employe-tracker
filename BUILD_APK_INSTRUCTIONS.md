# Building TrackMaster Android APK

Your app is now configured for native Android with **background location tracking**! Follow these steps to build the APK.

## Prerequisites
- **Node.js** installed on your computer
- **Android Studio** installed ([Download here](https://developer.android.com/studio))
- **Git** installed

## Step-by-Step Instructions

### 1. Export and Clone Project
1. Click **"Export to GitHub"** button in Lovable
2. On your computer, open terminal and run:
```bash
git clone <your-github-repo-url>
cd <your-project-folder>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Capacitor
```bash
npx cap init
```
When prompted, use these values:
- App ID: `app.lovable.0791849ca1444c1c9a6066c79268a176`
- App Name: `TrackMaster`

### 4. Add Android Platform
```bash
npx cap add android
```

### 5. Build the Web App
```bash
npm run build
```

### 6. Sync with Android
```bash
npx cap sync android
```

### 7. Open in Android Studio
```bash
npx cap open android
```

This will launch Android Studio with your project.

### 8. Configure Android Permissions
Android Studio should open automatically. The background location permissions are already configured in the capacitor.config.ts file.

### 9. Build APK in Android Studio

#### Option A: Build for Testing (Debug APK)
1. In Android Studio, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. Click **"locate"** in the notification to find your APK
4. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Build for Release (Signed APK)
1. Go to **Build → Generate Signed Bundle / APK**
2. Select **APK** and click **Next**
3. Create a new keystore or use existing one
4. Fill in the signing information
5. Click **Next** → **Finish**
6. Find your APK at: `android/app/release/app-release.apk`

### 10. Install on Your Phone

#### Via USB:
1. Enable **Developer Options** and **USB Debugging** on your Android phone
2. Connect phone to computer via USB
3. Run in Android Studio: **Run → Run 'app'**

#### Via APK File:
1. Transfer the APK file to your phone
2. Open the APK file on your phone
3. Allow installation from unknown sources if prompted
4. Install the app

## Background Location Features

Your app now has:
- ✅ **Background GPS tracking** - Works even when app is closed
- ✅ **Battery optimized** - Updates every 10 meters
- ✅ **Persistent notification** - Shows "TrackMaster is tracking"
- ✅ **Auto-start on boot** - Tracking continues after phone restart
- ✅ **Automatic permission requests** - Asks for location permissions

## Testing Background Tracking

1. Install and open the app
2. Sign up / Log in
3. Go to location tracker
4. Click **"Start Tracking"**
5. Grant location permissions (select "Allow all the time")
6. Close the app completely
7. Walk around - your location will be saved automatically!
8. Open app again to see your tracked locations

## Troubleshooting

**"SDK not found"**: Install Android SDK via Android Studio → Tools → SDK Manager

**"Build failed"**: Run `./gradlew clean` in the `android` folder, then rebuild

**"Permission denied"**: Make sure you granted "Allow all the time" for location

**Location not tracking in background**: Check phone's battery optimization settings and disable for TrackMaster

## For Play Store Release

To publish on Google Play Store:
1. Build a **signed release APK** (Option B above)
2. Create a Google Play Console account ($25 one-time fee)
3. Upload your APK and fill in store listing
4. Submit for review

## Need Help?

- Read the [Capacitor docs](https://capacitorjs.com/docs/android)
- Check [Android developer guide](https://developer.android.com/studio/run)
- Join Lovable community for support

---

**Important**: The `capacitor.config.ts` file currently points to the Lovable preview URL for hot-reload during development. For production, remove the `server` section from the config before building the final release APK.
