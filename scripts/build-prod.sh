#!/bin/bash

# Production build script for Converter project

set -e

echo \"🏗️  Building Converter for production...\"

# Build frontend
echo \"📦 Building frontend...\"
cd frontend
npm run build
cd ..

# Generate Prisma client
echo \"🗄️  Generating Prisma client...\"
npx prisma generate

# Create production directories
echo \"📁 Creating production directories...\"
mkdir -p dist
mkdir -p dist/uploads

# Copy necessary files
echo \"📋 Copying files...\"
cp -r backend/src dist/
cp backend/package.json dist/
cp -r frontend/.next dist/frontend
cp -r frontend/public dist/frontend/
cp -r worker dist/
cp .env dist/
cp prisma/schema.prisma dist/

echo \"✅ Production build complete!\"
echo \"📦 Build output is in the 'dist' directory\"
echo \"\"
echo \"To deploy:\"
echo \"1. Copy the 'dist' directory to your server\"
echo \"2. Run 'npm install --production' in the dist directory\"
echo \"3. Set up your production environment variables\"
echo \"4. Run 'node src/server.js' to start the backend\"
echo \"5. Serve the frontend/.next directory with a web server\"