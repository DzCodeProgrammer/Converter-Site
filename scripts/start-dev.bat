@echo off
REM Start development servers for Converter project

echo Starting Converter development servers...
echo.

REM Start backend server in a new window
echo Starting backend server...
start \"Backend Server\" cmd /k \"cd backend && npm run dev\"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new window
echo Starting frontend server...
start \"Frontend Server\" cmd /k \"cd frontend && npm run dev\"

echo.
echo Development servers are starting!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill the servers when done
taskkill /f /im node.exe 2>nul
echo All servers stopped.