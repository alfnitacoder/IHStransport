#!/usr/bin/env bash
# Start backend API and frontend dev server. Open: http://localhost:8080
# Usage: ./start-web.sh

set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

cleanup() { [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null; exit 0; }
trap cleanup SIGINT SIGTERM

# Start backend only if port 3001 is free
if command -v ss >/dev/null 2>&1; then
  IN_USE=$(ss -ltn 2>/dev/null | grep -c ':3001 ' || true)
else
  IN_USE=$( (echo >/dev/tcp/localhost/3001) 2>/dev/null && echo 1 || echo 0)
fi
if [ "${IN_USE:-0}" = "0" ]; then
  echo "Starting backend on port 3001..."
  (cd backend && node src/app.js) &
  BACKEND_PID=$!
  echo "Waiting for backend..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if (echo >/dev/tcp/localhost/3001) 2>/dev/null; then break; fi
    sleep 1
  done
else
  echo "Backend already running on port 3001."
  BACKEND_PID=""
fi

echo "Starting frontend at http://localhost:8080"
cd frontend
exec npm run dev
