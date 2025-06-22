#!/bin/bash

echo "🚀 Starting Oncology Reporter Services..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    # Kill all child processes of this script
    pkill -P $$
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# --- Start Backend (Port 5001) ---
echo "📡 Starting Backend API on port 5001..."
cd ../Oncology-reporter-API
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload &
BACKEND_PID=$!
cd ../frontend-oncology-reporter

# Wait a moment for backend to initialize
sleep 3

# --- Start Frontend (Port 5173) ---
echo "🌐 Starting Frontend on port 5173..."
cd client
npx vite &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started successfully!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait 