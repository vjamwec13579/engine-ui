# Quick Setup Guide

## First Time Setup

### 1. Prerequisites Installation

Ensure you have the following installed:

- **.NET 8 SDK**: Download from [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
- **Node.js 18+**: Download from [https://nodejs.org/](https://nodejs.org/)
- **PostgreSQL**: Your database should be running locally or accessible remotely
- **Azure CLI**: For KeyVault access - `az login` before running

### 2. Database Setup

Your PostgreSQL database should have these tables already created:
- `realtime_signal_store`
- `realtime_orders`

If not, you'll need to create them based on your existing schema.

### 3. Azure KeyVault Configuration

1. Login to Azure:
   ```bash
   az login
   ```

2. Ensure your KeyVault (set via `AZURE_KEYVAULT_URL` env var) has these secrets:
   - `ALPACA-KEY` - Your Alpaca API key
   - `ALPACA-SECRET` - Your Alpaca secret key

3. Grant your account access to the KeyVault secrets

### 4. Backend Configuration

1. Navigate to the API project:
   ```bash
   cd services/TradingEngine.API
   ```

2. Set required environment variables:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/database"
   export AZURE_KEYVAULT_URL="https://your-keyvault.vault.azure.net/"
   ```

   Or create a `.env` file (see `.env.example` for template).

3. Restore .NET packages:
   ```bash
   dotnet restore
   ```

4. Test the API:
   ```bash
   dotnet run
   ```

   Visit `http://localhost:5000/swagger` to see the API documentation

### 5. Frontend Configuration

1. Navigate to the UI project:
   ```bash
   cd ui
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   Visit `http://localhost:4200` to see the UI

### 6. Quick Start (Both Services)

Use the convenience scripts to start both services:

**Linux/Mac:**
```bash
./start-dev.sh
```

**Windows:**
```
start-dev.bat
```

## Verifying the Setup

1. **API Health Check**: Visit `http://localhost:5000/api/dashboard/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

2. **UI Load**: Visit `http://localhost:4200`
   - Should see the dashboard with dark blue theme

3. **Database Connection**: Check the dashboard for metrics
   - If you see data, PostgreSQL connection is working

4. **Alpaca Connection**: Navigate to Account tab
   - If you see account info, Alpaca integration is working

## Common Issues

### Backend won't start
- **Error**: "Could not load type"
  - Solution: Run `dotnet clean` then `dotnet restore`

- **Error**: "Unable to connect to database"
  - Solution: Check PostgreSQL is running and connection string is correct

- **Error**: "KeyVault access denied"
  - Solution: Run `az login` and check your KeyVault permissions

### Frontend won't start
- **Error**: "Cannot find module"
  - Solution: Delete `node_modules` and run `npm install` again

- **Error**: "Port 4200 is already in use"
  - Solution: Stop other Angular dev servers or use `ng serve --port 4201`

### No data showing
- **Issue**: Dashboard shows no metrics
  - Check that you have data in the `realtime_signal_store` and `realtime_orders` tables
  - Check browser console for API errors
  - Verify CORS is configured correctly in the backend

### CORS Errors
- **Issue**: Browser shows CORS errors
  - Ensure backend `Program.cs` has CORS policy configured
  - Check that the frontend URL matches the CORS allowed origins
  - Try clearing browser cache

## Next Steps

Once everything is running:

1. **Dashboard**: Monitor your trading engine health and performance
2. **Orders**: View and analyze your trading orders
3. **Account**: Check your Alpaca account status and positions

## Production Deployment

For production deployment:

1. Update `appsettings.Production.json` with production database connection
2. Enable SSL for PostgreSQL connection
3. Build Angular for production: `npm run build`
4. Deploy API to Azure App Service or container
5. Host Angular build output on Azure Static Web Apps or similar

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the API logs in the terminal
3. Verify all prerequisites are installed
4. Ensure database tables exist and have data
5. Confirm Azure KeyVault access is working
