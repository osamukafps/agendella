using Agendella.Application.Services;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ServiceEntity = Agendella.Domain.Entities.Service;

namespace Agendella.Infrastructure.Repositories;

public sealed class ServiceCatalogRepository(AgendellaDbContext dbContext) : IServiceCatalogStore
{
    public async Task<ServiceEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Services.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<ServiceEntity> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.Services.AsQueryable();

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(s =>
                s.CreatedAtUtc > cursorTime ||
                (s.CreatedAtUtc == cursorTime && s.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(s => s.CreatedAtUtc).ThenBy(s => s.Id);
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

    public async Task AddAsync(ServiceEntity service, CancellationToken cancellationToken = default)
    {
        await dbContext.Services.AddAsync(service, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
