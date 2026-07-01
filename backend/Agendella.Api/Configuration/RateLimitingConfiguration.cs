using System.Threading.RateLimiting;
using Agendella.Api.Contracts.Common;
using Microsoft.AspNetCore.RateLimiting;

namespace Agendella.Api.Configuration;

public static class RateLimitingConfiguration
{
    public const string LoginPolicy = "auth-login";
    public const string RefreshPolicy = "auth-refresh";
    public const string AuthenticatedPolicy = "authenticated";

    public static IServiceCollection AddConfiguredRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            var loginPerIpPerMinute = configuration.GetValue<int>("RateLimiting:LoginPerIpPerMinute", 5);
            var loginPerIpAndEmailPerHour = configuration.GetValue<int>("RateLimiting:LoginPerIpAndEmailPerHour", 10);
            var refreshPerIpPerMinute = configuration.GetValue<int>("RateLimiting:RefreshPerIpPerMinute", 30);
            var authenticatedPerCollaboratorPerMinute = configuration.GetValue<int>("RateLimiting:AuthenticatedPerCollaboratorPerMinute", 120);

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                if (httpContext.User.Identity?.IsAuthenticated == true)
                {
                    var collaboratorId = httpContext.User.FindFirst("sub")?.Value
                        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"auth:{collaboratorId}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = authenticatedPerCollaboratorPerMinute,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                        });
                }

                return RateLimitPartition.GetNoLimiter("anonymous");
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString();
                }

                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new ErrorResponse("rate_limit.exceeded", "Limite de requisicoes excedido para esta operacao."),
                    cancellationToken);
            };

            options.AddPolicy(LoginPolicy, httpContext =>
            {
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"login-ip:{ip}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = loginPerIpPerMinute,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    });
            });

            options.AddPolicy(RefreshPolicy, httpContext =>
            {
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"refresh:{ip}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = refreshPerIpPerMinute,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    });
            });

            options.AddPolicy(AuthenticatedPolicy, httpContext => RateLimitPartition.GetNoLimiter("auth-policy-noop"));
        });

        return services;
    }
}
