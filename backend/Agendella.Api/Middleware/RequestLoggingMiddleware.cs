using System.Diagnostics;
using System.Security.Claims;

namespace Agendella.Api.Middleware;

public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-Id"].ToString();
        if (string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = context.TraceIdentifier;
        }

        context.Response.Headers["X-Correlation-Id"] = correlationId;

        var tenantId = context.Items.TryGetValue(nameof(Agendella.Api.Tenancy.HttpTenantContext), out var tenant)
            ? tenant?.ToString()
            : null;
        var collaboratorId = context.User.FindFirstValue("sub") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = context.User.FindFirstValue("role");

        using var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["correlationId"] = correlationId,
            ["tenantId"] = tenantId,
            ["collaboratorId"] = collaboratorId,
            ["role"] = role,
            ["method"] = context.Request.Method,
            ["path"] = context.Request.Path.Value
        });

        var stopwatch = Stopwatch.StartNew();
        await next(context);
        stopwatch.Stop();

        logger.LogInformation(
            "Request completed with status {StatusCode} in {ElapsedMs} ms",
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds);
    }
}
