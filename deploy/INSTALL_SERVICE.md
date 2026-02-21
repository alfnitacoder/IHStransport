# Deploy IHStransport as a systemd service

This lets the API run in the background, restart on failure, and start on boot.

## Quick: get the web app running (dev)

From the repo root, run:

```bash
./start-web.sh
```

Then open **http://localhost:8080** in your browser. The script starts the backend (if not already running) and the frontend. Frontend runs on port **8080** (no root required). To use port 80 in production, use nginx (see section 6).

## 1. Prerequisites

- Node.js installed (e.g. `node --version` in PATH).
- App and backend at the path used in the service (default: `/home/wantok/cashlesstransit`).
- `.env` configured in `backend/` (DB, JWT, MyCash, etc.).
- PostgreSQL running (local or remote; see REMOTE_DB.md).

## 2. Edit the service file (if needed)

Open `deploy/ihstransport-api.service` and adjust:

- **User / Group** – user that owns the app (default `wantok`). Change to your deploy user.
- **WorkingDirectory** – path to the **backend** folder (default `/home/wantok/cashlesstransit/backend`).
- **EnvironmentFile** – path to `backend/.env` (default `/home/wantok/cashlesstransit/backend/.env`).
- **ExecStart** – use full path to `node` if needed: run `which node` and put that path in `ExecStart=/full/path/to/node src/app.js`.

## 3. Install and enable the service

```bash
# Copy service file (adjust path if your app is elsewhere)
sudo cp /home/wantok/cashlesstransit/deploy/ihstransport-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable start on boot
sudo systemctl enable ihstransport-api

# Start now
sudo systemctl start ihstransport-api

# Check status
sudo systemctl status ihstransport-api
```

## 4. Alternative: init.d script (easy restart with service)

If you prefer a classic `/etc/init.d/` script (e.g. `sudo service ihstransport-api restart`):

```bash
# Copy and make executable
sudo cp /home/wantok/cashlesstransit/deploy/ihstransport-api.init /etc/init.d/ihstransport-api
sudo chmod +x /etc/init.d/ihstransport-api

# Use it
sudo service ihstransport-api start
sudo service ihstransport-api stop
sudo service ihstransport-api restart
sudo service ihstransport-api status
```

Edit the variables at the top of `/etc/init.d/ihstransport-api` if your paths or user differ: `USER`, `DIR`, `CMD`, `PIDFILE`, `ENVFILE`.

**Optional:** enable on boot (Debian/Ubuntu): `sudo update-rc.d ihstransport-api defaults`

## 5. Useful commands (systemd)

| Command | Purpose |
|--------|---------|
| `sudo systemctl start ihstransport-api` | Start the API |
| `sudo systemctl stop ihstransport-api` | Stop the API |
| `sudo systemctl restart ihstransport-api` | Restart (e.g. after code or .env change) |
| `sudo systemctl status ihstransport-api` | Status and last lines of log |
| `journalctl -u ihstransport-api -f` | Follow API logs |
| `journalctl -u ihstransport-api -n 100` | Last 100 log lines |
| `sudo systemctl disable ihstransport-api` | Disable start on boot |

## 6. After code updates

**Option A – Deploy script (recommended):**

```bash
./deploy/deploy.sh          # pull, install, restart
./deploy/deploy.sh --migrate   # same + run DB migrations
```

**Option B – Manual:**

```bash
cd /home/wantok/cashlesstransit
git pull origin main
cd backend
npm install --production
sudo systemctl restart ihstransport-api
```

## 7. Nginx on port 80 (production)

To serve the app on **port 80** in production, use nginx to serve the built frontend and proxy `/api` to the backend.

**1. Build the frontend**

```bash
cd /home/wantok/cashlesstransit/frontend
npm install
npm run build
```

This creates `frontend/dist/`.

**2. Install nginx** (if not already)

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**3. Install the site config**

```bash
sudo cp /home/wantok/cashlesstransit/deploy/nginx-ihstransport.conf /etc/nginx/sites-available/ihstransport
sudo ln -sf /etc/nginx/sites-available/ihstransport /etc/nginx/sites-enabled/
# If you had a default site, optionally remove it: sudo rm /etc/nginx/sites-enabled/default
```

**4. Adjust paths** (if needed)

Edit `/etc/nginx/sites-available/ihstransport`: set `root` to your `frontend/dist` path (default: `/home/wantok/cashlesstransit/frontend/dist`).

**5. Test and reload**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**6. Permissions (if you get 500)**  
Nginx runs as `www-data` and must be able to read your `frontend/dist`. If the app root is under `/home/wantok/`, run once:

```bash
sudo chmod o+x /home/wantok /home/wantok/cashlesstransit /home/wantok/cashlesstransit/frontend /home/wantok/cashlesstransit/frontend/dist
sudo chmod -R o+rX /home/wantok/cashlesstransit/frontend/dist
```

Then open **http://&lt;server-ip&gt;** or **http://localhost** – the app loads on port 80 and API calls go to the backend.

**Useful nginx commands**

| Command | Purpose |
|--------|---------|
| `sudo nginx -t` | Test config |
| `sudo systemctl reload nginx` | Reload after config change |
| `sudo systemctl restart nginx` | Full restart |
| `sudo systemctl status nginx` | Status |

**Dev without nginx:** For development, use `./start-web.sh` – frontend on port 8080, backend on 3001.
