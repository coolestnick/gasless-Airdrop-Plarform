#!/bin/bash

echo "🚀 Gasless Airdrop System Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env and add your PRIVATE_KEY!"
fi

echo "Installing backend dependencies..."
npm install

echo ""
echo "✅ Backend setup complete!"
echo ""

# Go back to root
cd ..

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Copying .env from .env.example..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""

# Go back to root
cd ..

echo "=========================================="
echo "✨ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Edit backend/.env and add your PRIVATE_KEY"
echo "2. Fund your backend wallet with SHM tokens"
echo "3. Run: cd backend && npm run import-csv"
echo "4. Run backend: cd backend && npm run dev"
echo "5. Run frontend: cd frontend && npm start"
echo ""
echo "📚 See QUICKSTART.md for detailed instructions"
echo "=========================================="
