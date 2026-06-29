using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;

namespace Agendella.Application.Salons;

public sealed class SalonSettingsService(ITenantContext tenantContext, ISalonStore salonStore)
{
    public async Task<SalonTenant> GetAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        return await salonStore.FindByIdAsync(tenantId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Salao nao encontrado.", 404));
    }

    public async Task<SalonTenant> UpdateAsync(
        string name,
        string address,
        string phone,
        string timeZoneId,
        int minimumCancellationNoticeMinutes,
        CancellationToken cancellationToken = default)
    {
        var salon = await GetAsync(cancellationToken);

        salon.Name = name;
        salon.Address = address;
        salon.Phone = phone;
        salon.TimeZoneId = timeZoneId;
        salon.MinimumCancellationNoticeMinutes = minimumCancellationNoticeMinutes;
        salon.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await salonStore.SaveChangesAsync(cancellationToken);
        return salon;
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
