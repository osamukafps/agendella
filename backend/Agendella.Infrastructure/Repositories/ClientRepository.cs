using Agendella.Application.Clients;
using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class ClientRepository(AgendellaDbContext dbContext) : IClientStore
{
    public async Task<Client?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Clients.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<Client> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.Clients.AsQueryable();

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(c =>
                c.CreatedAtUtc > cursorTime ||
                (c.CreatedAtUtc == cursorTime && c.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(c => c.CreatedAtUtc).ThenBy(c => c.Id);
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

    public async Task AddAsync(Client client, CancellationToken cancellationToken = default)
    {
        await dbContext.Clients.AddAsync(client, cancellationToken);
    }

    public async Task<bool> PhoneExistsAsync(
        Guid tenantId,
        string phone,
        Guid? excludeClientId,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Clients
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenantId && c.Phone == phone);

        if (excludeClientId.HasValue)
        {
            query = query.Where(c => c.Id != excludeClientId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<ClientHistoryEvent> Items, string? NextCursor)> GetHistoryAsync(
        Guid clientId,
        Guid? requesterProfessionalId,
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.ClientHistoryEvents
            .Where(e => e.ClientId == clientId);

        if (requesterProfessionalId.HasValue)
        {
            query = query.Where(e =>
                e.Appointment != null &&
                e.Appointment.ProfessionalId == requesterProfessionalId.Value);
        }

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(e =>
                e.CreatedAtUtc > cursorTime ||
                (e.CreatedAtUtc == cursorTime && e.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(e => e.CreatedAtUtc).ThenBy(e => e.Id);
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

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
