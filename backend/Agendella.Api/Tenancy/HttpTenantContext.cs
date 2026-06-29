using Agendella.Application.Tenancy;

namespace Agendella.Api.Tenancy;

public sealed class HttpTenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }

    public bool HasTenant => TenantId.HasValue;

    public void SetTenant(Guid? tenantId)
    {
        TenantId = tenantId;
    }
}
