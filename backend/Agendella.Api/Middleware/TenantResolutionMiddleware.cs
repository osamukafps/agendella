using Agendella.Api.Tenancy;
using Agendella.Application.Common.Errors;

namespace Agendella.Api.Middleware;

public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    private static readonly string[] ClaimTypes = ["tenant_id", "tenantId", "tenant"];

    public async Task InvokeAsync(HttpContext context, HttpTenantContext tenantContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var rawTenantId = ClaimTypes
                .Select(type => context.User.FindFirst(type)?.Value)
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

            if (rawTenantId is null)
            {
                throw new ApplicationRuleException(new ApplicationError(
                    ErrorCodes.Unauthorized,
                    "A requisicao autenticada nao informou o tenant ativo.",
                    StatusCodes.Status401Unauthorized));
            }

            if (!Guid.TryParse(rawTenantId, out var tenantId))
            {
                throw new ApplicationRuleException(new ApplicationError(
                    ErrorCodes.Unauthorized,
                    "O tenant informado no contexto autenticado e invalido.",
                    StatusCodes.Status401Unauthorized));
            }

            tenantContext.SetTenant(tenantId);
            context.Items[nameof(HttpTenantContext)] = tenantId;
        }
        else
        {
            tenantContext.SetTenant(null);
            context.Items.Remove(nameof(HttpTenantContext));
        }

        await next(context);
    }
}
