using Agendella.Application.Salons;
using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class SalonRepository(AgendellaDbContext dbContext) : ISalonStore
{
    public async Task<SalonTenant?> FindByIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await dbContext.SalonTenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == tenantId, cancellationToken);
    }

    public async Task<IReadOnlyList<SalonBusinessHour>> GetBusinessHoursAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await dbContext.SalonBusinessHours
            .Where(h => h.TenantId == tenantId)
            .OrderBy(h => h.DayOfWeek)
            .ToListAsync(cancellationToken);
    }

    public async Task ReplaceBusinessHoursAsync(Guid tenantId, IReadOnlyList<SalonBusinessHour> hours, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.SalonBusinessHours
            .Where(h => h.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        dbContext.SalonBusinessHours.RemoveRange(existing);
        dbContext.SalonBusinessHours.AddRange(hours);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
