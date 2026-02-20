# Web App Updates – Frontend & Backend

Summary of changes to the Cashless Transit web app (React frontend and Node/Express backend).

---

## Backend

### MyCash & Settings
- **MyCash base URL** – Default API URL set to `https://www.gifts.digicelpacific.com/mycash`; optional `MYCASH_PRODUCT_ID` (e.g. 373) in config and payment request body.
- **Admin-editable MyCash credentials** – Stored in `system_settings` (DB). Config is read from DB first, then env.
- **New routes**
  - `GET /api/settings/mycash` – Get MyCash settings (admin only; secrets masked).
  - `PUT /api/settings/mycash` – Update MyCash settings (admin only).
  - `GET /api/settings/mycash/status` – Check MyCash API connection (admin only).
- **Config** – `backend/src/config/mycash-loader.js` loads MyCash config from DB + env for all payment calls.

### MyCash Errors & Status
- **Error codes 600–606** – `backend/src/payments/mycash-errors.js` maps MyCash codes to messages (API Key, Invalid User, Invalid Method, Payment error, Invalid Product ID, Mandatory parameter empty, Invalid customer mobile).
- **Payment routes** – Top-up initiate/send-otp/approve error responses include `mycash_code` and `mycash_status` when the gateway returns an error.
- **Status endpoint** – Returns `connected: true` or `connected: false` with `code` and `message` (and optional `mycash_status`).

### Multi-mode (Bus, Plane, Ship)
- **DB** – `buses.transport_type` and `fare_config.transport_type` added (`'bus' | 'plane' | 'ship'`, default `'bus'`). Migration adds columns to existing DBs.
- **Buses API** – POST and PATCH accept and return `transport_type`.
- **Reports** – Dashboard stats include `vehicles_by_type`; dashboard query resilient if `transport_type` is missing.

### Auth
- **Signup** – Register endpoint only allows roles `customer` and `bus_owner`. Returns 400 for `admin` or `agent`.

### Other
- **Dashboard errors** – Dashboard catch returns `{ error, status: 500 }` for consistent error handling.
- **Payments errors** – All top-up error responses include `status`, `mycash_code`, `mycash_status` when applicable.

---

## Frontend

### Branding & Navigation
- **App name** – “Bus Cashless” → “Cashless Transit” (sidebar, landing).
- **Nav labels** – “Buses” → “Fleet”, “Bus Owners” → “Operators”, “Bus Map” → “Fleet Map”.
- **Landing** – Copy updated for bus, plane, and ship; operators/fleet wording.

### Settings (Admin only)
- **New page** – `/settings` (sidebar only for admin).
- **MyCash form** – Edit API URL, API Key, Username, Password, Merchant Mobile, Product ID (key/password optional to keep current).
- **API status** – “Check connection” calls `/api/settings/mycash/status`; shows “Connected” or “Error &lt;code&gt;” and message; expandable list of MyCash error codes 600–606.
- **Errors** – Load/save errors show “API &lt;status&gt;: &lt;message&gt;”.

### Fleet (Buses)
- **Transport type** – Add/Edit vehicle: type dropdown (Bus, Plane, Ship) and Type column in table.
- **Operator label** – Depends on type: “Operator (bus owner)”, “Airport / Airline (operator)”, “Shipping company (operator)” with matching “Select…” placeholders.
- **Edit vehicle** – “Edit” per row (admin only): update Vehicle number, Route, **NFC Device ID**, Status; shows Bus ID for app config and owner name.
- **Add vehicle** – Intro text: “Bus = bus owner; Plane = airport or airline; Ship = shipping/boat company.”
- **Owners fetch** – Owners list fetched only when user is admin (avoids 403 for bus_owner on Fleet).

### Operators
- **Page text** – Note that operators can be bus owners, airports/airlines (planes), or shipping/boat companies (ships).
- **Name placeholder** – “e.g. Bus Co., Airport, Airline, or Shipping Company”.

### Currency (VUV)
- **Helper** – `frontend/src/utils/currency.js`: `formatVUV(amount)` → e.g. `"1,234 VUV"`.
- **All amounts** – Dashboard, BusOwnerDashboard, Payments, Owners, Cards, CustomerDashboard, Reports use `formatVUV`; no `$`.
- **Labels** – “Amount (VUV)”, “Balance (VUV)”, “Initial Balance (VUV)” where relevant; top-up amount placeholder “e.g. 500”.

### Dashboards & Errors
- **Dashboard, BusOwnerDashboard, AgentDashboard** – On API failure, show red box: “API Error (status)” and server message; Dashboard suggests running `npm run migrate` if needed.
- **Payments** – Initiate/Send OTP/Approve errors show “MyCash Error &lt;code&gt;: &lt;description&gt;” when backend sends `mycash_code`/`mycash_status`.

### Signup
- **Account type** – Dropdown only “Customer” and “Bus Owner (Operator)”; Agent removed.

---

## Database

- **system_settings** – Key/value table for admin settings (e.g. MyCash credentials).
- **buses** – Column `transport_type` (default `'bus'`).
- **fare_config** – Column `transport_type` (default `'bus'`).
- **Migration** – `npm run migrate` adds `transport_type` to existing DBs.

---

## Docs

- **README** – Cashless Transit, multi-mode, VUV, operators wording.
- **NFC-app/API_INTEGRATION.md** – “How to add an NFC device” (web + device steps); backend endpoints for NFC devices.

---

## Quick reference – New / changed API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/settings/mycash` | Get MyCash settings (admin, masked) |
| PUT | `/api/settings/mycash` | Update MyCash settings (admin) |
| GET | `/api/settings/mycash/status` | MyCash connection check (admin) |
| POST | `/api/auth/register` | Signup; body `role` only `customer` or `bus_owner` |
| GET | `/api/buses` | Returns `transport_type` per vehicle |
| POST | `/api/buses` | Body may include `transport_type` |
| PATCH | `/api/buses/:id` | Body may include `transport_type`, `device_id`, etc. |
| GET | `/api/reports/dashboard` | Stats include `vehicles_by_type`; errors include `status` |
| POST | `/api/payments/topup/*` | Error body includes `mycash_code`, `mycash_status` when applicable |
