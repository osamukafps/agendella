using System.Data.Common;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Agendella.Tests.Infrastructure;

public sealed class PostgresTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _connectionString;

    public PostgresTestFixture()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Agendella.Api"))
            .AddJsonFile("appsettings.Development.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        _connectionString = Environment.GetEnvironmentVariable("AGENDLLA_TEST_POSTGRES")
            ?? configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Postgres test connection string was not configured.");
    }

    public string ConnectionString => _connectionString;

    public Task InitializeAsync() => Task.CompletedTask;

    public new Task DisposeAsync() => Task.CompletedTask;

    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    public async Task<PostgresTransactionScope> BeginTransactionScopeAsync(CancellationToken cancellationToken = default)
    {
        var connection = await CreateOpenConnectionAsync(cancellationToken);
        var transaction = await connection.BeginTransactionAsync(cancellationToken);
        return new PostgresTransactionScope(connection, transaction);
    }
}

public sealed class PostgresTransactionScope(DbConnection connection, DbTransaction transaction) : IAsyncDisposable
{
    public DbConnection Connection { get; } = connection;

    public DbTransaction Transaction { get; } = transaction;

    public async ValueTask DisposeAsync()
    {
        await Transaction.RollbackAsync();
        await Transaction.DisposeAsync();
        await Connection.DisposeAsync();
    }
}
