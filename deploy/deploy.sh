#!/usr/bin/env bash
# Deploy IHStransport: pull, install, optional migrate, restart API service.
# Usage: ./deploy/deploy.sh [--migrate]
# Run from repo root or with REPO_ROOT set.

set -e
REPO_ROOT="${REPO_ROOT:-/home/wantok/cashlesstransit}"
cd "$REPO_ROOT"

echo "==> Deploying from $REPO_ROOT"

echo "==> Git pull"
git pull origin main

echo "==> Backend install"
cd backend && npm install --production && cd ..

if [[ "$1" == "--migrate" ]]; then
  echo "==> Running migrations (PostgreSQL)"
  cd backend && npm run migrate:pg && cd ..
fi

echo "==> Restarting ihstransport-api service"
sudo systemctl restart ihstransport-api

echo "==> Done. Check: sudo systemctl status ihstransport-api"
