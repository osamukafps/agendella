using Agendella.Domain.Entities;

namespace Agendella.Application.Salons;

public interface ISalonStore
{
    Task<SalonTenant?> FindByIdAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalonBusinessHour>> GetBusinessHoursAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task ReplaceBusinessHoursAsync(Guid tenantId, IReadOnlyList<SalonBusinessHour> hours, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
