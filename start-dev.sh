#!/bin/bash

# Start the Trading Engine Management System in Development Mode

echo "Starting Trading Engine Management System..."

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the backend API
echo "Starting .NET API on http://localhost:5000..."
cd services/TradingEngine.API
dotnet run &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start the Angular frontend
echo "Starting Angular UI on http://localhost:4200..."
cd ../../ui
npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Trading Engine Management System is running!"
echo "=========================================="
echo "Backend API:  http://localhost:5000"
echo "Swagger UI:   http://localhost:5000/swagger"
echo "Frontend UI:  http://localhost:4200"
echo "=========================================="
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
