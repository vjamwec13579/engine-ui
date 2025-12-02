using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

namespace TradingEngine.API.Services;

public interface IKeyVaultService
{
    Task<string> GetSecretAsync(string secretName);
}

public class KeyVaultService : IKeyVaultService
{
    private readonly SecretClient _secretClient;
    private readonly ILogger<KeyVaultService> _logger;
    private readonly Dictionary<string, string> _cache = new();

    public KeyVaultService(IConfiguration configuration, ILogger<KeyVaultService> logger)
    {
        _logger = logger;

        // Read from environment variable first, then fall back to configuration
        var keyVaultUrl = Environment.GetEnvironmentVariable("AZURE_KEYVAULT_URL")
                          ?? configuration["AzureKeyVault:Url"];

        if (string.IsNullOrEmpty(keyVaultUrl))
        {
            throw new InvalidOperationException(
                "Azure KeyVault URL not configured. Set AZURE_KEYVAULT_URL environment variable.");
        }

        try
        {
            var credential = new DefaultAzureCredential();
            _secretClient = new SecretClient(new Uri(keyVaultUrl), credential);
            _logger.LogInformation("KeyVault client initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize KeyVault client");
            throw;
        }
    }

    public async Task<string> GetSecretAsync(string secretName)
    {
        try
        {
            // Check cache first
            if (_cache.TryGetValue(secretName, out var cachedValue))
            {
                return cachedValue;
            }

            _logger.LogInformation("Fetching secret from KeyVault: {SecretName}", secretName);
            var secret = await _secretClient.GetSecretAsync(secretName);

            // Cache the secret
            _cache[secretName] = secret.Value.Value;

            return secret.Value.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching secret from KeyVault: {SecretName}", secretName);
            throw;
        }
    }
}
