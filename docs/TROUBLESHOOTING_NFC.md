# Troubleshooting: NFC app / validator “still not working”

Use this checklist when the validator app shows **Offline**, **Rejected**, tap does nothing, or **the app doesn’t open at all**.

---

## If the app doesn’t open (icon tap does nothing or screen goes black)

1. **Connect the device with USB**, enable **USB debugging**, and run:
   ```bash
   adb logcat -c
   adb shell am start -n com.vansmarttransit.validator/.MainActivity
   ```
   Wait 5 seconds, then run:
   ```bash
   adb logcat -d | grep -E "MainActivity|AndroidRuntime|FATAL|Exception"
   ```
   Share the output so we can see the crash or error.

2. **New builds** include a fallback: if startup fails, you should see a dark screen with **“Startup error:”** and a message. If you see that, the message is the cause (e.g. missing class, resource, or permission).

3. **Reinstall** the latest APK after pulling fixes:
   ```bash
   cd cashless-NFC/android-validator-app
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 1. Check “Server” status in the app

- **Van Smart Validator (cashless-NFC):** In the header you should see **“Server: OK”** (green). If you see **“Server: unreachable”** or **“Set API URL in Settings”**, the app cannot reach the backend.
- Fix:
  - Open **Settings** and set **API URL** to your backend, e.g. `http://<laptop-ip>:3001` (no trailing `/api` – the app adds it).
  - Use your laptop’s **LAN IP** (e.g. `192.168.1.5` or `172.16.20.127`), not `localhost`.

## 2. Backend must be running and reachable

- On the machine that hosts the backend (e.g. your laptop):
  ```bash
  cd IHStransport/backend
  npm run dev
  ```
- You should see: `Server running on port 3001` and `For validator app, use API URL: http://<this-machine-ip>:3001`.
- **Connection refused from device:** The app shows "Server: unreachable" and logcat shows `ECONNREFUSED` to `172.16.20.104:3001`. Fix:
  1. Ensure the backend is **running** on the Mac when you open the app or tap.
  2. Ensure the backend is bound to all interfaces (it uses `0.0.0.0` so the NFC device can connect).
  3. **macOS firewall:** System Settings → Network → Firewall → allow incoming connections for Node (or turn off firewall for testing).
- Test from the same machine: open `http://localhost:3001/api/payments/connection-test` in a browser; you should get JSON with `"ok": true`.

## 3. Same network

- The **phone/validator** and the **laptop** must be on the same Wi‑Fi (or same LAN).  
- If the app shows **“Server: unreachable”**, try pinging the laptop from the phone (e.g. with a “Network utilities” app) or ensure no firewall is blocking port **3001** on the laptop.

## 4. Card not found (Rejected + “Register in web app”)

- The backend returns this when the tapped card **UID** is not in the **cards** table.
- In the app, the message usually shows the UID to use, e.g. **“Register in web app (Cards) with UID: A1B2C3D4”**.
- In the **IHStransport web app**: go to **Cards**, add a new card, and set **Card UID** to that exact value (with or without colons; the backend normalizes it). Set an initial **balance** and save. Then tap again.

## 5. Tap does nothing

- Ensure **NFC** is enabled in device settings.
- If the app uses **tag UID** (no NDEF), the backend expects **POST /api/payments/fare** with `card_uid`, `bus_id`, `fare_amount`. The validator app sends these when it treats the tap as UID.
- Check **Settings**: **Bus ID** and **Fare amount** must be set. The backend must have that bus and a fare config; otherwise fare request can fail.

## 6. Quick backend check (laptop)

```bash
# Connection test
curl -s http://localhost:3001/api/payments/connection-test

# Fare config for bus 1 (adjust if you use another bus_id)
curl -s "http://localhost:3001/api/payments/fare-config?bus_id=1"
```

If these work on the laptop, use the **same host** but with the laptop’s **LAN IP** in the app (e.g. `http://192.168.1.5:3001`).

## 7. Logs

- **Backend:** Watch the terminal where `npm run dev` is running for errors when you tap.
- **App (cashless-NFC):** With the device connected via USB, run:
  ```bash
  adb logcat -s MainActivity:* ValidatorApiService:* OkHttp:*
  ```
  Then tap a card and look for errors or the printed UID.

After fixing API URL and network, the header should show **“Server: OK”** and taps should hit the backend; if the card is registered, the tap should be approved.
