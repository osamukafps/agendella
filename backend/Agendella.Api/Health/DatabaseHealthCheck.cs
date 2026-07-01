using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;

namespace Agendella.Api.Health;

public sealed class DatabaseHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return HealthCheckResult.Unhealthy("Postgres connection string is not configured.");
        }

        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            return HealthCheckResult.Healthy("Postgres connection established.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Postgres connection failed.", exception);
        }
    }
}
