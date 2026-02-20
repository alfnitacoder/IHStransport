#!/bin/bash

echo "🚌 Bus Cashless System - Setup Script"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt install postgresql"
    echo "   macOS: brew install postgresql"
else
    echo "✅ PostgreSQL is installed"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📝 Next steps:"
echo "1. Set up PostgreSQL database (see INSTALLATION.md)"
echo "2. Copy backend/.env.example to backend/.env and configure it"
echo "3. Run: cd backend && npm run migrate"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "Default login: admin / admin123"
