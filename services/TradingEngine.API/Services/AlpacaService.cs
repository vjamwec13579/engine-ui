using Alpaca.Markets;
using TradingEngine.API.DTOs;

namespace TradingEngine.API.Services;

public interface IAlpacaService
{
    Task<AlpacaAccountInfo> GetAccountInfoAsync();
    Task<List<AlpacaPosition>> GetPositionsAsync();
    Task<List<AlpacaOrderInfo>> GetOrdersAsync(int limit = 100);
}

public class AlpacaService : IAlpacaService
{
    private readonly IKeyVaultService _keyVaultService;
    private readonly ILogger<AlpacaService> _logger;
    private IAlpacaTradingClient? _tradingClient;

    public AlpacaService(IKeyVaultService keyVaultService, ILogger<AlpacaService> logger)
    {
        _keyVaultService = keyVaultService;
        _logger = logger;
    }

    private async Task<IAlpacaTradingClient> GetTradingClientAsync()
    {
        if (_tradingClient != null)
        {
            return _tradingClient;
        }

        try
        {
            var apiKey = await _keyVaultService.GetSecretAsync("ALPACA-KEY");
            var secretKey = await _keyVaultService.GetSecretAsync("ALPACA-SECRET");

            var config = new SecretKey(apiKey, secretKey);
            _tradingClient = Alpaca.Markets.Environments.Paper.GetAlpacaTradingClient(config);

            _logger.LogInformation("Alpaca trading client initialized");
            return _tradingClient;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing Alpaca trading client");
            throw;
        }
    }

    public async Task<AlpacaAccountInfo> GetAccountInfoAsync()
    {
        try
        {
            var client = await GetTradingClientAsync();
            var account = await client.GetAccountAsync();

            return new AlpacaAccountInfo
            {
                AccountId = account.AccountId.ToString(),
                Status = account.Status.ToString(),
                Currency = account.Currency ?? "USD",
                Cash = account.TradableCash,
                PortfolioValue = account.Equity.GetValueOrDefault(),
                BuyingPower = account.BuyingPower.GetValueOrDefault(),
                DaytradeCount = (int?)(ulong?)account.DayTradeCount,
                PatternDayTrader = account.TradeSuspendedByUser,
                TradingBlocked = account.IsTradingBlocked,
                TransfersBlocked = account.IsTransfersBlocked,
                AccountBlocked = account.IsAccountBlocked,
                CreatedAt = account.CreatedAtUtc
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Alpaca account info");
            throw;
        }
    }

    public async Task<List<AlpacaPosition>> GetPositionsAsync()
    {
        try
        {
            var client = await GetTradingClientAsync();
            var positions = await client.ListPositionsAsync();

            return positions.Select(p => new AlpacaPosition
            {
                Symbol = p.Symbol,
                Quantity = p.Quantity,
                AvailableQuantity = p.AvailableQuantity,
                MarketValue = p.MarketValue.GetValueOrDefault(),
                CostBasis = p.CostBasis,
                UnrealizedPnl = p.UnrealizedProfitLoss.GetValueOrDefault(),
                UnrealizedPnlPercent = p.UnrealizedProfitLossPercent.GetValueOrDefault(),
                CurrentPrice = p.AssetCurrentPrice,
                AverageEntryPrice = p.AverageEntryPrice,
                Side = p.Side.ToString(),
                AssetClass = p.AssetClass.ToString()
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Alpaca positions");
            throw;
        }
    }

    public async Task<List<AlpacaOrderInfo>> GetOrdersAsync(int limit = 100)
    {
        try
        {
            var client = await GetTradingClientAsync();
            var request = new ListOrdersRequest
            {
                LimitOrderNumber = limit,
                OrderListSorting = SortDirection.Descending
            };

            var orders = await client.ListOrdersAsync(request);

            return orders.Select(o => new AlpacaOrderInfo
            {
                OrderId = o.OrderId.ToString(),
                Symbol = o.Symbol,
                Quantity = o.Quantity.GetValueOrDefault(),
                FilledQuantity = o.FilledQuantity,
                OrderType = o.OrderType.ToString(),
                Side = o.OrderSide.ToString(),
                TimeInForce = o.TimeInForce.ToString(),
                Status = o.OrderStatus.ToString(),
                LimitPrice = o.LimitPrice,
                StopPrice = o.StopPrice,
                FilledAveragePrice = o.AverageFillPrice,
                SubmittedAt = o.SubmittedAtUtc,
                FilledAt = o.FilledAtUtc,
                ExpiredAt = o.ExpiredAtUtc,
                CanceledAt = o.CancelledAtUtc
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Alpaca orders");
            throw;
        }
    }
}
