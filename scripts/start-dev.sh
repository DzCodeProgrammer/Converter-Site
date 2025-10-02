#!/bin/bash

# Start development servers for Converter project

echo \"🚀 Starting Converter development servers...\"
echo \"\"

# Function to cleanup background processes
cleanup() {
    echo \"\n🛑 Stopping servers...\"
    pkill -f \"npm run dev\"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server in background
echo \"🔧 Starting backend server...\"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo \"🎨 Starting frontend server...\"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo \"\"
echo \"✅ Development servers are running!\"
echo \"📡 Backend: http://localhost:4000\"
echo \"🌐 Frontend: http://localhost:3000\"
echo \"\"
echo \"Press Ctrl+C to stop all servers...\"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID