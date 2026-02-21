# Install the NFC Android app on your device

**NFC app = the Android app in this repo:** `IHStransport/nfc-app`. Do not use any other path or project (e.g. not `cashless-NFC`).

You have **development mode** (USB debugging) enabled. Use one of these ways to get the app onto your NFC device.

## Quick: Android Studio (recommended)

1. **Open the project**  
   - Start **Android Studio**.  
   - **File → Open** and choose the **`nfc-app`** folder inside `IHStransport`.

2. **Sync and build**  
   - Wait for Gradle sync to finish (first time may download SDK/Gradle).  
   - Connect your **NFC Android device** with USB.  
   - If prompted on the phone, allow **USB debugging**.  
   - In Android Studio, click the green **Run** button (or **Run → Run 'app'**).  
   - Pick your device and confirm.  
   - The app will **build and install** on the device.

3. **On the device**  
   - Open **IHStransport NFC**.  
   - Set **API base URL** (e.g. `http://<your-laptop-ip>:3001`), **Bus ID**, and **Fare amount**.  
   - Tap **Test connection**, then **Save**.  
   - Tap an NFC card to process a fare.

## Alternative: Build APK, then install with adb

1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
2. When the build finishes, use “locate” or go to:  
   `nfc-app/app/build/outputs/apk/debug/app-debug.apk`  
3. With the device connected and USB debugging on:
   ```bash
   cd IHStransport/nfc-app
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

If `adb` is not in your PATH, use the one from your Android SDK (e.g. inside Android Studio’s SDK path).

---

**Backend:** Ensure the IHStransport backend is running (e.g. on your laptop) and that the phone and laptop are on the same Wi‑Fi. Use the laptop’s LAN IP in the app’s API URL (e.g. `http://192.168.1.100:3001`).
