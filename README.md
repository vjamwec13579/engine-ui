# Trading Engine Management System

A full-stack application for managing and monitoring your trading engine with real-time statistics, order management, and account integration with Alpaca.

## Architecture

- **Backend**: C# .NET 8 Web API
- **Frontend**: Angular 17 with dark blue theme
- **Database**: PostgreSQL
- **Cloud**: Azure KeyVault for secrets management
- **Trading**: Alpaca Markets API integration

## Project Structure

```
engine-ui/
├── services/
│   └── TradingEngine.API/        # C# .NET Web API
│       ├── Controllers/           # API endpoints
│       ├── Data/                  # Database context
│       ├── DTOs/                  # Data transfer objects
│       ├── Models/                # Database models
│       └── Services/              # Business logic services
└── ui/
    └── src/
        ├── app/
        │   ├── components/        # Angular components
        │   │   ├── dashboard/     # Dashboard with metrics
        │   │   ├── orders/        # Orders management
        │   │   └── account/       # Account management
        │   ├── models/            # TypeScript interfaces
        │   └── services/          # API services
        └── styles.css             # Dark blue theme
```

## Features

### Dashboard
- Engine health status monitoring
- Cluster uptime tracking
- Trades per minute metrics
- Gross portfolio value
- YTD P&L and return percentage
- Real-time updates every 30 seconds

### Orders Management
- View orders by status (Active, Completed, Rejected, Outstanding, All)
- Order statistics (win rate, average profit, etc.)
- Detailed order information including Greeks (Delta, Gamma, Theta, Vega)
- Real-time P&L calculations

### Account Management
- Alpaca account information
- Current positions with P&L
- Account balance and buying power
- Pattern day trader status
- Account restrictions monitoring

## Setup Instructions

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- PostgreSQL database
- Azure account with KeyVault setup
- Alpaca trading account

### Backend Setup

1. Navigate to the services directory:
   ```bash
   cd services/TradingEngine.API
   ```

2. Update `appsettings.json` with your PostgreSQL connection string:
   ```json
   {
     "ConnectionStrings": {
       "PostgreSQL": "Host=localhost;Port=5432;Database=finAI;Username=your_user;Password=your_password;SSL Mode=Disable"
     },
     "AzureKeyVault": {
       "Url": "https://your-keyvault.vault.azure.net/"
     }
   }
   ```

3. Ensure Azure KeyVault has these secrets:
   - `ALPACA-KEY`: Your Alpaca API key
   - `ALPACA-SECRET`: Your Alpaca secret key

4. Restore dependencies and run:
   ```bash
   dotnet restore
   dotnet run
   ```

   The API will start on `http://localhost:5000` (or as configured in launchSettings.json)

### Frontend Setup

1. Navigate to the UI directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL if needed in `src/app/services/api.service.ts`:
   ```typescript
   private baseUrl = 'http://localhost:5000/api';
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The UI will be available at `http://localhost:4200`

## Database Schema

### realtime_signal_store
Stores real-time market signals and indicators including:
- OHLCV data
- Technical indicators (RSI, MFI, ADX, etc.)
- Kalman filter regime signals
- VWAP and regression slopes

### realtime_orders
Stores trading orders with:
- Order details (symbol, strike, expiry, etc.)
- Entry and current prices
- Greeks (Delta, Gamma, Theta, Vega)
- P&L tracking
- Order states

## API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/health` - Health check

### Orders
- `GET /api/orders` - Get all orders (paginated)
- `GET /api/orders/active` - Get active orders
- `GET /api/orders/completed` - Get completed orders
- `GET /api/orders/rejected` - Get rejected orders
- `GET /api/orders/outstanding` - Get outstanding orders
- `GET /api/orders/statistics` - Get order statistics

### Account
- `GET /api/account/info` - Get Alpaca account info
- `GET /api/account/positions` - Get current positions
- `GET /api/account/alpaca-orders` - Get Alpaca orders

## Theme

The UI uses a custom dark blue theme with the following color palette:
- Primary Blue: `#1e3a8a`
- Secondary Blue: `#2563eb`
- Accent Blue: `#3b82f6`
- Light Blue: `#60a5fa`
- Dark Background: `#0f172a`
- Card Background: `#1e293b`

## Security

- API keys stored securely in Azure KeyVault
- CORS configured for Angular app
- Azure DefaultAzureCredential for authentication
- SSL support for PostgreSQL in production

## Development

### Adding New Features

1. **Backend**: Add controllers in `Controllers/`, services in `Services/`, and models in `Models/` or `DTOs/`
2. **Frontend**: Add components in `components/`, update models in `models/`, and API calls in `services/api.service.ts`

### Running Tests

Backend:
```bash
cd services/TradingEngine.API
dotnet test
```

Frontend:
```bash
cd ui
npm test
```

## Production Deployment

1. Update connection strings in `appsettings.Production.json`
2. Enable SSL mode for PostgreSQL
3. Update CORS origins in `Program.cs`
4. Build the Angular app: `npm run build`
5. Deploy the API to Azure App Service or container
6. Host the Angular build output on a static web host

## Troubleshooting

### Backend Issues
- Verify PostgreSQL connection string
- Ensure Azure credentials are configured (`az login`)
- Check KeyVault permissions for the service principal

### Frontend Issues
- Verify API URL is correct
- Check browser console for CORS errors
- Ensure backend is running before starting frontend

## License

Proprietary - All rights reserved
