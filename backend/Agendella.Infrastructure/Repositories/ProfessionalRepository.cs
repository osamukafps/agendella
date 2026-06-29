using Agendella.Application.Professionals;
using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class ProfessionalRepository(AgendellaDbContext dbContext) : IProfessionalStore
{
    public async Task<Professional?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Professionals.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<Professional> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.Professionals.AsQueryable();

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(p =>
                p.CreatedAtUtc > cursorTime ||
                (p.CreatedAtUtc == cursorTime && p.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(p => p.CreatedAtUtc).ThenBy(p => p.Id);
        var items = await query.Take(pageSize + 1).ToListAsync(cancellationToken);

        string? nextCursor = null;
        if (items.Count > pageSize)
        {
            items = items.Take(pageSize).ToList();
            var last = items[^1];
            nextCursor = CursorHelper.Encode(last.CreatedAtUtc, last.Id);
        }

        return (items, nextCursor);
    }

    public async Task AddAsync(Professional professional, CancellationToken cancellationToken = default)
    {
        await dbContext.Professionals.AddAsync(professional, cancellationToken);
    }

    public async Task<IReadOnlyList<ProfessionalWeeklyAvailability>> GetWeeklyAvailabilityAsync(
        Guid professionalId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.ProfessionalWeeklyAvailabilities
            .Where(a => a.ProfessionalId == professionalId)
            .OrderBy(a => a.DayOfWeek)
            .ToListAsync(cancellationToken);
    }

    public async Task ReplaceWeeklyAvailabilityAsync(
        Guid professionalId,
        Guid tenantId,
        IReadOnlyList<ProfessionalWeeklyAvailability> slots,
        CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.ProfessionalWeeklyAvailabilities
            .Where(a => a.ProfessionalId == professionalId)
            .ToListAsync(cancellationToken);

        dbContext.ProfessionalWeeklyAvailabilities.RemoveRange(existing);
        dbContext.ProfessionalWeeklyAvailabilities.AddRange(slots);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
