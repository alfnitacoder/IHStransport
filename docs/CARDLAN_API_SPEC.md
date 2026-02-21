# Cardlan API (Device CL-A0618K)

Reference document for the Cardlan API used by the Android validator device **CL-A0618K**.  
Source: Cardlan Group (Shenzhen). Version 1.0.

---

## 1. Card reading data uploading

**Purpose:** Upload each card read to the server in real time (JSON).

**Endpoint:** `POST http://xxx/device/upLoadCardInfo`

| Attribute   | Type   | Description                    |
|------------|--------|--------------------------------|
| equipmentNo| String | Device number                  |
| cardNo     | String | Card number                    |
| cardResult | String | Card type (default `"1"`)      |
| time       | String | Card read time `yyyyMMddHHmmss`|
| longitude  | String | Longitude                      |
| latitude   | String | Latitude                       |

**Example request body:**
```json
{
  "equipmentNo": "005203",
  "cardNo": "9196",
  "time": "20190318110906",
  "cardResult": "1",
  "longitude": "113.0352",
  "latitude": "22.0352"
}
```

**Response:** `{ "msg": "operation succeed", "code": 0 }` — `code === 0` means success.

---

## 2. QR code scanning data uploading

**Purpose:** Upload each QR scan for consumption.

**Endpoint:** `POST http://xxx/device/upLoadQrCodeInfo`

| Attribute   | Type   | Description           |
|------------|--------|-----------------------|
| equipmentNo| String | Device number         |
| type       | String | Payment type (default `"1"`) |
| time       | String | Scan time `yyyyMMddHHmmss` |
| qrCode     | String | QR code (hexString)   |
| remark     | String | Reserved              |
| longitude  | String | Longitude             |
| latitude   | String | Latitude              |

**Example request body:**
```json
{
  "equipmentNo": "000001",
  "type": "1",
  "time": "20190318110906",
  "qrCode": "3048545050152150685300000005",
  "remark": "",
  "longitude": "0.0",
  "latitude": "0.0"
}
```

**Response:** Same as card interface — `{ "msg": "...", "code": 0 }`.

---

## 3. Longitude and latitude (GPS) upload

**Purpose:** Device reports location to the server.

**Cycle:** Every **5 seconds**.

**Endpoint:** `POST http://xxx/device/upLoadGpsInfo`

| Attribute   | Type   | Description   |
|------------|--------|---------------|
| equipmentNo| String | Device number |
| longitude  | String | Longitude     |
| latitude   | String | Latitude      |

**Example request body:**
```json
{
  "equipmentNo": "000001",
  "longitude": "0.0",
  "latitude": "0.0"
}
```

---

## Relation to IHStransport

- **Current flow:** The NFC validator app posts card taps to the IHStransport backend (`POST /api/payments/fare` with `card_uid`, `bus_id`, `fare_amount`).
- **Cardlan flow:** Cardlan expects `upLoadCardInfo` with `equipmentNo`, `cardNo`, `time`, `cardResult`, and optional `longitude`/`latitude`.

If the device or a backend must also satisfy Cardlan’s API (e.g. for reporting or third-party integration), options include:

1. **App dual-post:** After a successful fare call to IHStransport, the app also calls Cardlan’s `upLoadCardInfo` (with `cardNo` = card UID or formatted number, `equipmentNo` = device/bus id, `time` = `yyyyMMddHHmmss`).
2. **Backend proxy:** IHStransport backend receives the tap, then forwards an equivalent payload to Cardlan’s base URL (e.g. `CARDLAN_BASE_URL/device/upLoadCardInfo`) if configured.

Contact: kathy@cardlangroup.com | Tel: 0086-13530321253
