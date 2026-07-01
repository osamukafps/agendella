using System.Security.Claims;
using Agendella.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Agendella.Tests.Api;

public sealed class StructuredLoggingPrivacyTests
{
    [Fact]
    public async Task RequestLogging_ShouldIncludeTenantContextWithoutLeakingPii()
    {
        var logger = new InMemoryLogger<RequestLoggingMiddleware>();
        var middleware = new RequestLoggingMiddleware(_ => Task.CompletedTask, logger);

        var context = new DefaultHttpContext();
        context.TraceIdentifier = "corr-123";
        context.Items[nameof(Agendella.Api.Tenancy.HttpTenantContext)] = "tenant-456";
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = "/clientes";
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", "collab-789"),
            new Claim("role", "administradora"),
            new Claim(ClaimTypes.Email, "admin@agendella.local")
        ], "test"));

        await middleware.InvokeAsync(context);

        var entry = Assert.Single(logger.Entries);
        Assert.Contains("Request completed", entry.Message);
        Assert.DoesNotContain("admin@agendella.local", entry.Message);
        Assert.Contains("corr-123", entry.ScopeValues);
        Assert.Contains("tenant-456", entry.ScopeValues);
        Assert.Contains("collab-789", entry.ScopeValues);
    }

    private sealed class InMemoryLogger<T> : ILogger<T>
    {
        public List<LogEntry> Entries { get; } = [];
        private string _currentScope = string.Empty;

        public IDisposable BeginScope<TState>(TState state) where TState : notnull
        {
            _currentScope = state is IEnumerable<KeyValuePair<string, object?>> values
                ? string.Join(';', values.Select(value => $"{value.Key}={value.Value}"))
                : state?.ToString() ?? string.Empty;

            return new Scope(this);
        }

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            Entries.Add(new LogEntry(formatter(state, exception), _currentScope));
        }

        private sealed class Scope(InMemoryLogger<T> owner) : IDisposable
        {
            public void Dispose()
            {
                owner._currentScope = string.Empty;
            }
        }

        public sealed record LogEntry(string Message, string ScopeValues);
    }
}
