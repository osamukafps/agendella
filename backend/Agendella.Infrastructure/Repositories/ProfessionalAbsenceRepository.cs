using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class ProfessionalAbsenceRepository(AgendellaDbContext dbContext) : IProfessionalAbsenceStore
{
    public async Task<ProfessionalAbsence?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.ProfessionalAbsences.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<ProfessionalAbsence> Items, string? NextCursor)> ListAsync(
        Guid professionalId, int pageSize, string? cursor, CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.ProfessionalAbsences
            .Where(a => a.ProfessionalId == professionalId);

        if (parsed.HasValue)
        {
            var (cursorTime, cursorId) = parsed.Value;
            query = query.Where(a =>
                a.StartAtUtc > cursorTime ||
                (a.StartAtUtc == cursorTime && a.Id.CompareTo(cursorId) > 0));
        }

        query = query.OrderBy(a => a.StartAtUtc).ThenBy(a => a.Id);
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

    public async Task AddAsync(ProfessionalAbsence absence, CancellationToken cancellationToken = default)
        => await dbContext.ProfessionalAbsences.AddAsync(absence, cancellationToken);

    public async Task<Professional?> GetProfessionalAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.Professionals.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsOverlappingAsync(
        Guid professionalId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default)
    {
        return await dbContext.Appointments
            .Where(a =>
                a.ProfessionalId == professionalId &&
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
