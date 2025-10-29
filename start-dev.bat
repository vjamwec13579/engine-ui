@echo off
echo Starting Trading Engine Management System...

echo.
echo Starting .NET API on http://localhost:5000...
start cmd /k "cd services\TradingEngine.API && dotnet run"

echo Waiting for backend to start...
timeout /t 5 /nobreak

echo.
echo Starting Angular UI on http://localhost:4200...
start cmd /k "cd ui && npm start"

echo.
echo ==========================================
echo Trading Engine Management System is running!
echo ==========================================
echo Backend API:  http://localhost:5000
echo Swagger UI:   http://localhost:5000/swagger
echo Frontend UI:  http://localhost:4200
echo ==========================================
echo Close the command windows to stop services
echo.
