# NFC App API Integration Guide

## How to add an NFC device

1. **In the web app (admin):**
   - Log in as **admin**.
   - Go to **Fleet** (sidebar).
   - Either **add a new vehicle** and fill in **Device ID** (e.g. `nfc-bus-01`), or **edit** an existing vehicle and set **Device ID**.
   - Note the **vehicle ID** (bus id) shown in the list — the NFC app needs this as `BUS_ID`.

2. **On the NFC device (Android app):**
   - Install the NFC app and configure:
     - `API_BASE_URL` = your backend URL (e.g. `https://your-server.com/api`)
     - `BUS_ID` = the **vehicle/bus id** from the Fleet list (integer)
     - `DEVICE_ID` = same unique ID you entered in the web app (e.g. `nfc-bus-01`)
   - The device will send fare payments with this `bus_id`; the backend links the vehicle to the device via the stored `device_id` for reference.

3. **Summary:** One NFC device is linked to one vehicle. Set **Device ID** on the vehicle in Fleet, then use the same **BUS_ID** and **DEVICE_ID** in the app config on that device.

---

## Backend API Endpoints for NFC Devices

### 1. Process Fare Payment

**Endpoint**: `POST /api/payments/fare`

**Authentication**: Not required (public endpoint for devices)

**Request Body**:
```json
{
  "card_uid": "ABC123DEF456",
  "bus_id": 1,
  "fare_amount": 2.50,
  "device_timestamp": "2024-02-19T12:00:00Z",
  "latitude": -17.8252,
  "longitude": 31.0335,
  "location_accuracy": 10.5
}
```

**Response** (Success):
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "card_id": 5,
    "bus_id": 1,
    "amount": 2.50,
    "balance_after": 47.50,
    "latitude": -17.8252,
    "longitude": 31.0335,
    "status": "completed"
  },
  "new_balance": 47.50
}
```

**Response** (Error - Insufficient Balance):
```json
{
  "error": "Insufficient balance"
}
```

**Response** (Error - Card Not Found):
```json
{
  "error": "Card not found"
}
```

**Response** (Error - Card Blocked):
```json
{
  "error": "Card is blocked"
}
```

### 2. Update Bus Location (periodic GPS)

Send location from the NFC app so the server can show the bus on the map. Use this endpoint (no auth).

**Endpoint**: `POST /api/devices/location`

**Authentication**: Not required (device is identified by `validator_id`; server checks it is assigned to the given `bus_id`).

**Request Body**:
```json
{
  "validator_id": "VALIDATOR-ABC123",
  "bus_id": 2,
  "latitude": -17.73,
  "longitude": 168.32,
  "accuracy": 10.0
}
```

| Field          | Type   | Required | Description                          |
|----------------|--------|----------|--------------------------------------|
| `validator_id` | string | Yes      | Same Validator ID from Settings      |
| `bus_id`       | number | Yes      | Assigned bus ID (from register)      |
| `latitude`     | number | Yes      | GPS latitude                          |
| `longitude`    | number | Yes      | GPS longitude                         |
| `accuracy`     | number | No       | Accuracy in metres (from GPS)         |

**When to call**: Every **45 seconds** while the app is in the foreground, but only if the device has an API URL, a `bus_id` (from register), and a Validator ID. If the device is not yet assigned to a bus, skip location updates.

**Response** (Success):
```json
{
  "ok": true,
  "message": "Location updated",
  "bus_id": 2
}
```

**Response** (Error - Device not registered):
```json
{
  "error": "Device not found. Register first with POST /api/devices/register."
}
```

**Response** (Error - Wrong bus):
```json
{
  "error": "Device is not assigned to this bus_id"
}
```

**Example (curl)** – replace with your server URL, validator ID, bus_id, and coordinates:
```bash
curl -X POST http://localhost:3001/api/devices/location \
  -H "Content-Type: application/json" \
  -d '{"validator_id":"VALIDATOR-ABC123","bus_id":2,"latitude":-17.73,"longitude":168.32,"accuracy":10.0}'
```

### 3. Get Fare Configuration

**Endpoint**: `GET /api/payments/fare-config?bus_id=<BUS_ID>`

**Purpose**: Get current fare for the assigned bus so the app can show "Fare: X.XX VUV". Call after register returns a `bus_id`.

**Response** (example): `{ "bus_id": 2, "fare_amount": 4.5, "route_name": "...", "transport_type": "..." }`

## Implementation Flow

### Typical Transaction Flow

```
1. Passenger taps NFC card
   ↓
2. Device reads card UID
   ↓
3. Get current GPS location
   ↓
4. Call POST /api/payments/fare
   ↓
5. If online:
   - Success → Show success message
   - Error → Show error message
   ↓
6. If offline:
   - Store transaction locally
   - Show "Processing..." message
   ↓
7. When online:
   - Sync stored transactions
   - Update status
```

## Error Handling

### Network Errors
- Store transaction locally
- Show "Processing offline" message
- Retry sync when connection restored

### Payment Errors
- Insufficient balance → Show error, don't deduct
- Card not found → Show error
- Card blocked → Show error
- Invalid card → Show error

### GPS Errors
- If GPS unavailable, send transaction without coordinates
- Log GPS error for debugging

## Offline Transaction Storage

Store transactions in local SQLite database:

```sql
CREATE TABLE offline_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_uid TEXT NOT NULL,
    bus_id INTEGER NOT NULL,
    fare_amount REAL NOT NULL,
    latitude REAL,
    longitude REAL,
    location_accuracy REAL,
    device_timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sync_attempts INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Sync Process

1. Check for pending transactions
2. For each pending transaction:
   - Call POST /api/payments/fare
   - If success: Mark as synced
   - If error: Increment sync_attempts
   - If sync_attempts > 5: Mark as failed, alert admin

## Configuration

### Required Configuration

```properties
# Backend API
API_BASE_URL=https://api.example.com/api

# Device Configuration
DEVICE_ID=DEVICE-001
BUS_ID=1

# Fare Configuration
DEFAULT_FARE=2.50

# GPS Configuration
LOCATION_UPDATE_INTERVAL=30000
MIN_GPS_ACCURACY=50

# Sync Configuration
SYNC_INTERVAL=60000
MAX_SYNC_ATTEMPTS=5
```

## Testing Checklist

- [ ] NFC card reading works
- [ ] Fare payment processes successfully
- [ ] GPS coordinates included in transactions
- [ ] Offline transactions stored correctly
- [ ] Sync works when connection restored
- [ ] Error messages display correctly
- [ ] Location updates sent periodically
- [ ] Handles network timeouts gracefully
- [ ] Handles invalid cards correctly
- [ ] Handles insufficient balance correctly
