using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;

namespace Agendella.Application.Salons;

public sealed record BusinessHourEntry(
    DayOfWeek DayOfWeek,
    TimeOnly? StartLocalTime,
    TimeOnly? EndLocalTime,
    bool IsClosed);

public sealed class BusinessHoursService(ITenantContext tenantContext, ISalonStore salonStore)
{
    public async Task<IReadOnlyList<SalonBusinessHour>> GetAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        return await salonStore.GetBusinessHoursAsync(tenantId, cancellationToken);
    }

    public async Task<IReadOnlyList<SalonBusinessHour>> ReplaceAsync(
        IReadOnlyList<BusinessHourEntry> entries,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var hours = entries.Select(e => new SalonBusinessHour
        {
            TenantId = tenantId,
            DayOfWeek = e.DayOfWeek,
            StartLocalTime = e.StartLocalTime,
            EndLocalTime = e.EndLocalTime,
            IsClosed = e.IsClosed,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        }).ToList();

        await salonStore.ReplaceBusinessHoursAsync(tenantId, hours, cancellationToken);
        return hours;
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
