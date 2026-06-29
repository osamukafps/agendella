using Agendella.Application.Common.Errors;

namespace Agendella.Api.Middleware;

public sealed class CsrfProtectionMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> ProtectedPaths =
    [
        "/auth/refresh",
        "/auth/logout"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        if (HttpMethods.IsPost(context.Request.Method) && ProtectedPaths.Contains(context.Request.Path.Value ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            var headerValue = context.Request.Headers["X-CSRF-Protection"].ToString();
            if (!string.Equals(headerValue, "1", StringComparison.Ordinal))
            {
                throw new ApplicationRuleException(new ApplicationError(
                    ErrorCodes.CsrfProtectionMissing,
                    "A protecao CSRF obrigatoria nao foi informada.",
                    StatusCodes.Status400BadRequest));
            }
        }

        await next(context);
    }
}
