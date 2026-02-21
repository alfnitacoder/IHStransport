# How the NFC validator app passes data to the server

The app uses the **backend API** only (the base URL set in **Settings → API URL**, e.g. `http://172.16.0.68:3001`). It does **not** talk to the web frontend. All requests are sent to that base URL.

---

## 1. Connection check

**When:** On startup and periodically (e.g. every 15 seconds) so the status line updates when the server goes down or comes back.

**Request:**
- **GET** `{baseUrl}/api/payments/connection-test`
- No body, no auth.

**Purpose:** Verify the backend is reachable. The app shows "Server: OK" or "Server: Error" based on the response.

---

## 2. Device registration (and heartbeat)

**When:**
- Right after a successful connection check (so the device appears in the admin **NFC Devices** list).
- Then every **60 seconds** as a heartbeat so the device stays "online" and its "last seen" time is updated.

**Request:**
- **POST** `{baseUrl}/api/devices/register`
- **Body (JSON):** `{ "validator_id": "<Validator ID from Settings>" }`
- No auth.

**Response:** The server returns the device record. If the device is **assigned to a bus** (`bus_id` in the response), the app:
- Saves that `bus_id` locally and in Settings.
- Calls **GET** `{baseUrl}/api/payments/fare-config?bus_id=<id>` to fetch the bus fare and shows it on the main screen (e.g. "Fare: 4.50 VUV").

---

## 3. Fare payment (card tap)

**When:** A rider taps an NFC card (or enters a card UID). The app gets the current GPS location, then sends the fare request.

**Request:**
- **POST** `{baseUrl}/api/payments/fare`
- **Body (JSON):**
  - `card_uid` (string) – NFC tag UID or card identifier.
  - `bus_id` (number) – from device assignment (or default 1).
  - `fare_amount` (number) – e.g. 4.50.
  - `device_timestamp` (string) – ISO timestamp.
  - **If location is available:** `latitude`, `longitude`, and optionally `location_accuracy`.

**Example (with GPS):**
```json
{
  "card_uid": "04A1B2C3D4E5F6",
  "bus_id": 2,
  "fare_amount": 4.50,
  "device_timestamp": "2025-02-20T10:30:00.000Z",
  "latitude": -17.73,
  "longitude": 168.32,
  "location_accuracy": 12.5
}
```

**Purpose:** Charge the card, record the transaction, and (when lat/long are present) update the bus's last position and append a row to location history. The app then shows "Approved" or "Rejected" and resets the screen.

---

## 4. Periodic GPS (location) reporting

**When:** Every **45 seconds** while the app is in the foreground, **if** the device has an API URL, a **bus_id** (assigned bus), and a Validator ID.

**Request:**
- **POST** `{baseUrl}/api/devices/location`
- **Body (JSON):**
  - `validator_id` (string) – device's Validator ID.
  - `bus_id` (number) – assigned bus.
  - `latitude` (number)
  - `longitude` (number)
  - `accuracy` (number, optional) – from the location provider.

**Example:**
```json
{
  "validator_id": "VALIDATOR-ABC123",
  "bus_id": 2,
  "latitude": -17.73,
  "longitude": 168.32,
  "accuracy": 10.0
}
```

**Purpose:** Keep the bus's last position up to date on the server so the **NFC Devices** page and the **Transport Map** show the vehicle's location even when there are no fare taps. The server updates the bus's `last_latitude`, `last_longitude`, `last_location_update` and inserts a row into `bus_locations`.

**Note:** The server only accepts this request if the device is registered and assigned to the given `bus_id`.

---

## 5. Fare config (for display)

**When:** After a successful **device register** response that includes an assigned `bus_id`. The app then fetches the fare for that bus to show on the main screen.

**Request:**
- **GET** `{baseUrl}/api/payments/fare-config?bus_id=<BUS_ID>`
- No body, no auth.

**Response (example):** `{ "bus_id": 2, "fare_amount": 4.5, "route_name": "...", "transport_type": "..." }`

**Purpose:** Show the correct "Fare: X.XX VUV" on the validator so the operator and riders see the bus fare from the server.

---

## Summary table

| What           | Method | Endpoint                          | When / trigger                    |
|----------------|--------|-----------------------------------|-----------------------------------|
| Connection     | GET    | `/api/payments/connection-test`   | Startup + every 15 s              |
| Register       | POST   | `/api/devices/register`           | After OK connection + every 60 s  |
| Fare config    | GET    | `/api/payments/fare-config?bus_id=` | After register returns bus_id   |
| Fare payment   | POST   | `/api/payments/fare`              | Each card tap (with optional GPS) |
| Location       | POST   | `/api/devices/location`           | Every 45 s when assigned to bus  |

All of the above use the same **base URL** configured in the app (Settings → API URL). No authentication is required for these NFC/device endpoints; the server identifies the device by `validator_id` and (for location) checks that it is assigned to the given bus.
