namespace Agendella.Application.Tenancy;

public interface ITenantContext
{
    Guid? TenantId { get; }

    bool HasTenant { get; }
}
