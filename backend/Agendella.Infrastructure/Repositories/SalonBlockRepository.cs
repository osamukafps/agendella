using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class SalonBlockRepository(AgendellaDbContext dbContext) : ISalonBlockStore
{
    public async Task<SalonBlock?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.SalonBlocks.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<SalonBlock> Items, string? NextCursor)> ListAsync(
        int pageSize, string? cursor, CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.SalonBlocks.AsQueryable();

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(b =>
                b.StartAtUtc > cursorTime ||
                (b.StartAtUtc == cursorTime && b.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(b => b.StartAtUtc).ThenBy(b => b.Id);
        var items = await query.Take(pageSize + 1).ToListAsync(cancellationToken);

        string? nextCursor = null;
        if (items.Count > pageSize)
        {
            items = items.Take(pageSize).ToList();
            var last = items[^1];
            nextCursor = CursorHelper.Encode(last.StartAtUtc, last.Id);
        }

        return (items, nextCursor);
    }

    public async Task AddAsync(SalonBlock block, CancellationToken cancellationToken = default)
        => await dbContext.SalonBlocks.AddAsync(block, cancellationToken);

    public Task DeleteAsync(SalonBlock block, CancellationToken cancellationToken = default)
    {
        dbContext.SalonBlocks.Remove(block);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsOverlappingAsync(
        Guid tenantId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default)
    {
        return await dbContext.Appointments
            .Where(a =>
                a.TenantId == tenantId &&
                a.Status == AppointmentStatus.Scheduled &&
                a.StartAtUtc < end && a.EndAtUtc > start)
            .ToListAsync(cancellationToken);
    }

    public Task MarkRequiresReviewAsync(
        IReadOnlyList<Appointment> appointments, string reason, CancellationToken cancellationToken = default)
    {
        foreach (var appointment in appointments)
        {
            appointment.RequiresReview = true;
            appointment.ReviewReason = reason;
            appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await dbContext.SaveChangesAsync(cancellationToken);
}
