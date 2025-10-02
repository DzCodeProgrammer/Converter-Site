#!/bin/bash

# Development setup script for Converter project
# This script sets up the entire development environment

set -e

echo \"🚀 Setting up Converter development environment...\"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo \"❌ Node.js is not installed. Please install Node.js 18+ first.\"
    exit 1
fi

echo \"✅ Node.js version: $(node -v)\"

# Install backend dependencies
echo \"📦 Installing backend dependencies...\"
cd backend
npm install
cd ..

# Install frontend dependencies
echo \"📦 Installing frontend dependencies...\"
cd frontend
npm install
cd ..

# Install worker dependencies
echo \"📦 Installing worker dependencies...\"
cd worker
npm install
cd ..

# Set up Prisma
echo \"🗄️  Setting up database...\"
export DATABASE_URL=\"file:./dev.db\"
npx prisma generate
npx prisma db push

# Create uploads directory
echo \"📁 Creating uploads directory...\"
mkdir -p uploads

echo \"✅ Development environment setup complete!\"
echo \"\"
echo \"To start development:\"
echo \"1. Run 'npm run dev' in the backend directory\"
echo \"2. Run 'npm run dev' in the frontend directory\"
echo \"3. Open http://localhost:3000 in your browser\"
echo \"\"
echo \"Or use the provided start script: ./scripts/start-dev.sh\"