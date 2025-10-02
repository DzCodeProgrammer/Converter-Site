@echo off
REM Development setup script for Converter project (Windows)
REM This script sets up the entire development environment

echo Setting up Converter development environment...

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Node.js version:
node -v

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Install worker dependencies
echo Installing worker dependencies...
cd worker
call npm install
cd ..

REM Set up Prisma
echo Setting up database...
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma db push

REM Create uploads directory
echo Creating uploads directory...
if not exist \"uploads\" mkdir uploads

echo Development environment setup complete!
echo.
echo To start development:
echo 1. Run 'npm run dev' in the backend directory
echo 2. Run 'npm run dev' in the frontend directory  
echo 3. Open http://localhost:3000 in your browser
echo.
echo Or use the provided start script: scripts\\start-dev.bat
pause