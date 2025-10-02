@echo off
REM Pre-commit validation script for Converter project

echo Checking project for errors before git commit...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Not in project root directory
    exit /b 1
)

echo [1/5] Checking frontend dependencies...
cd frontend
call npm list --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Frontend dependencies missing or corrupt
    echo Running npm install...
    call npm install
)
cd ..

echo [2/5] Checking backend dependencies...
cd backend
call npm list --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Backend dependencies missing or corrupt
    echo Running npm install...
    call npm install
)
cd ..

echo [3/5] Checking worker dependencies...
cd worker
call npm list --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Worker dependencies missing or corrupt
    echo Running npm install...
    call npm install
)
cd ..

echo [4/5] Checking Prisma setup...
if not exist "prisma\schema.prisma" (
    echo Error: Prisma schema missing
    exit /b 1
)

echo [5/5] Creating uploads directory if missing...
if not exist "uploads" mkdir uploads

echo.
echo ✅ All checks passed! Project is ready for commit.
echo.