# NFC Android App Specification (IHStransport)

This document describes how the **NFC Android app** (used on the bus, at the airport, or at the boat terminal) should work so it behaves like the **IHStransport web app**: customer swipes/taps their prepaid NFC card → payment is deducted from the card balance and recorded in the same backend (transactions, settlements, MyCash flow unchanged).

---

## 1. Role of the NFC device in the system

- **Where it is used:** On the bus, at the airport, or at the boat/ship terminal — anywhere the customer gets their ticket by **tapping** a prepaid NFC card.
- **What it does:** Reads the card UID, sends a **fare payment** to the IHStransport backend. The backend deducts from the **card balance** (topped up via **MyCash** on the web/agent side) and creates a `fare_payment` transaction.
- **MyCash:** MyCash is **not** used on the NFC device. MyCash is only for **topping up** the card (initiate → OTP → approve) via the web app or agent. The tap on the device uses the **prepaid balance** already on the card.

Flow:

1. Customer tops up card via **MyCash** (web/agent) → balance updated in backend.
2. Customer taps card on **NFC device** (bus/airport/boat) → device calls backend → backend deducts fare from that balance and records transaction.
3. Transaction appears in the same reports and settlements as in the web app.

---

## 2. What the NFC Android app must do

### 2.1 Configuration (per device)

The app should be configurable with:

| Setting      | Description |
|-------------|-------------|
| **API base URL** | Backend base URL (e.g. `https://your-api.com`). |
| **Bus ID**       | The vehicle/terminal ID from the web app (`buses.id`). Admin creates the bus in **Buses** and assigns an **NFC Device ID**; the app must use the same **Bus ID** (numeric) when calling the API. |
| **Device ID**    | Optional; should match `buses.device_id` in the web app (e.g. `nfc-bus-01`) for identification. |
| **Fare amount**  | Default fare in local currency (e.g. `2.50`). Can be fixed in config or fetched from the backend (see §3). |

In the web app, admin: **Buses** → Add/Edit vehicle → set **NFC Device ID** (e.g. `nfc-bus-01`) and use **Bus ID** (e.g. `1`) as the value for **Bus ID** in the Android app.

### 2.2 On card tap

1. **Read NFC card UID** (the unique identifier of the physical card).
2. **Call the fare payment API** (see §3) with:
   - `card_uid` = read UID
   - `bus_id` = configured Bus ID
   - `fare_amount` = configured fare (or from API)
   - Optionally: `device_timestamp`, `latitude`, `longitude`, `location_accuracy` (if the device has GPS).
3. **Handle response:**
   - **Success:** Show success and `new_balance` (and optionally transaction id).
   - **Error:** Show user-friendly message (see §4).

### 2.3 Offline / retry

- If the backend is unreachable, the app can show “No connection” and optionally **queue** the tap for retry when online (future enhancement). The current backend **requires online** processing; it does not support offline auth.

---

## 3. API used by the NFC app

### 3.0 Test connection (e.g. to laptop)

To **test that the NFC app can reach the backend** (e.g. when the backend runs on your laptop):

**GET** `{API_BASE_URL}/api/payments/connection-test`  
No authentication.

**Example for laptop on same Wi‑Fi:**  
If the backend runs on the laptop at port 3001 and the laptop’s IP is `192.168.1.100`, set API base URL to `http://192.168.1.100:3001` in the app, then call:

- `GET http://192.168.1.100:3001/api/payments/connection-test`

**Success response (200):**

```json
{
  "ok": true,
  "message": "Connection successful. NFC device can reach this server.",
  "server_time": "2025-02-20T12:00:00.000Z",
  "api": "IHStransport"
}
```

- The NFC app should provide a **“Test connection”** (or “Test connection to laptop”) action in settings. On tap, it calls this endpoint and shows “Connected” if it gets `ok: true`, or “Cannot reach server” / the error if not.
- **Laptop setup:** Run the backend so it listens on all interfaces (e.g. `0.0.0.0`), not only `localhost`. In Node, that usually means starting the app as usual (default is often `0.0.0.0`). Ensure the laptop firewall allows incoming TCP on the backend port (e.g. 3001). Use the laptop’s **LAN IP** (e.g. from `ifconfig` / `ip addr` or System Preferences → Network) as the API base URL host.

### 3.1 Process fare payment (main call)

**POST** `{API_BASE_URL}/api/payments/fare`  
No authentication required (intended for NFC devices).

**Request body (JSON):**

| Field              | Type     | Required | Description |
|--------------------|----------|----------|-------------|
| `card_uid`         | string   | Yes      | NFC card UID as read from the card. |
| `bus_id`           | number   | Yes      | Vehicle/terminal ID (from web app Buses). |
| `fare_amount`      | number   | Yes      | Fare to deduct (e.g. 2.50). |
| `device_timestamp` | string   | No       | ISO 8601 timestamp when the device read the card. |
| `latitude`         | number   | No       | Device latitude (for GPS tracking). |
| `longitude`        | number   | No       | Device longitude. |
| `location_accuracy`| number   | No       | Accuracy in meters. |

**Example:**

```json
{
  "card_uid": "04A1B2C3D4E5F6",
  "bus_id": 1,
  "fare_amount": 2.50,
  "device_timestamp": "2025-02-20T10:30:00Z",
  "latitude": -17.8252,
  "longitude": 31.0335,
  "location_accuracy": 10.5
}
```

**Success response (200):**

```json
{
  "success": true,
  "transaction": { "id": 123, "card_id": 1, "bus_id": 1, "amount": 2.50, ... },
  "new_balance": 47.50
}
```

**Error responses (4xx/5xx):** JSON with `error` message string. See §4 for mapping to UI messages.

### 3.2 Get fare for a vehicle (optional)

So the app does not need to hardcode fare, the backend can expose:

**GET** `{API_BASE_URL}/api/payments/fare-config?bus_id=1`  
No authentication.

**Response (200):**

```json
{
  "bus_id": 1,
  "fare_amount": 2.50,
  "route_name": "City – Airport",
  "transport_type": "bus"
}
```

If no fare is configured for that bus, return 404 or a default. The NFC app can use this to set or display the fare amount.

---

## 4. Error handling (backend → app messages)

| HTTP | Backend `error` / condition | Suggested user message |
|------|-----------------------------|--------------------------|
| 400  | Card not found              | “Card not recognised. Please use a registered card.” |
| 400  | Card is inactive/blocked/expired/lost | “Card cannot be used.” |
| 400  | Insufficient balance        | “Insufficient balance. Please top up via MyCash.” |
| 400  | Card UID / bus ID / fare missing | “Invalid request.” (log and fix config.) |
| 404  | Card not found              | “Card not registered.” |
| 5xx  | Server/network error        | “Payment unavailable. Try again.” |

---

## 5. Data flow summary

- **Web app:** Registers cards, tops up via MyCash, manages buses and operators, views transactions and reports.
- **NFC device:** Only performs **fare payment**: read card UID → POST `/api/payments/fare` → show result.
- **MyCash:** Used only for **top-up** (web/agent). Not involved in the tap on the bus/airport/boat.

So: the NFC app “works like” the web app in the sense that every tap is the same **fare payment** the web app expects: same API, same `transactions` table, same balance and settlements; the only difference is the **client** (Android NFC device instead of browser).

---

## 6. Security and deployment notes

- Use **HTTPS** only for the API base URL.
- Do not store MyCash credentials on the NFC device; they are only used on the backend.
- In the web app, assign each physical device a **Bus ID** and optional **Device ID** so transactions are attributed to the correct vehicle/terminal.
- Fare amount can be enforced server-side in a future version; currently the backend trusts `fare_amount` from the client (device/route-specific config recommended).

---

## 7. References in this repo

- Fare payment implementation: `backend/src/payments/payments.routes.js` (`POST /fare`).
- GPS and request shape: `GPS_API_DOCUMENTATION.md`.
- Web app bus/device setup: `frontend/src/pages/Buses.jsx` (NFC Device ID and Bus ID).
- Database: `database/schema.sql` (`cards`, `buses`, `transactions`).
