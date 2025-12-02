#!/bin/bash

# Start the Trading Engine Management System in Development Mode

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from bashrc (extract exports only)
eval "$(grep -E '^export (DATABASE_URL|LOCAL_DATABASE_URL|AZURE_KEYVAULT_URL|POLYGON_API_KEY)=' ~/.bashrc)"

echo "Starting Trading Engine Management System..."

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $MARKET_DATA_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the backend API
echo "Starting .NET API on http://localhost:5000..."
(cd "$SCRIPT_DIR/services/TradingEngine.API" && dotnet run) &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start the Market Data API
echo "Starting Market Data API on http://localhost:5002..."
(cd "$SCRIPT_DIR/monitor" && python3 market_data_api.py --local) &
MARKET_DATA_PID=$!

# Wait for market data API to start
sleep 2

# Start the Angular frontend
echo "Starting Angular UI on http://localhost:4200..."
(cd "$SCRIPT_DIR/ui" && npm start) &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Trading Engine Management System is running!"
echo "=========================================="
echo "Backend API:     http://localhost:5000"
echo "Swagger UI:      http://localhost:5000/swagger"
echo "Market Data API: http://localhost:5002"
echo "Frontend UI:     http://localhost:4200"
echo "=========================================="
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
