using Agendella.Application.Common.Errors;
using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Repositories;

public sealed class AppointmentRepository(AgendellaDbContext dbContext) : IAppointmentStore, ISchedulingDataStore
{
    // --- IAppointmentStore ---

    public async Task<Appointment?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<Appointment> Items, string? NextCursor)> ListAsync(
        Guid? professionalId,
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        var parsed = CursorHelper.Decode(cursor);
        var query = dbContext.Appointments.AsQueryable();

        if (professionalId.HasValue)
        {
            query = query.Where(a => a.ProfessionalId == professionalId.Value);
        }

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

    public async Task CreateAsync(Appointment appointment, AppointmentConflictError? existingConflict, CancellationToken cancellationToken = default)
    {
        if (existingConflict is not null)
        {
            ThrowConflictException(existingConflict);
        }

        await dbContext.Appointments.AddAsync(appointment, cancellationToken);
    }

    public async Task UpdateAsync(Appointment appointment, AppointmentConflictError? existingConflict, CancellationToken cancellationToken = default)
    {
        if (existingConflict is not null)
        {
            ThrowConflictException(existingConflict);
        }

        dbContext.Appointments.Update(appointment);
        await Task.CompletedTask;
    }

    public async Task AddHistoryEventAsync(ClientHistoryEvent historyEvent, CancellationToken cancellationToken = default)
    {
        await dbContext.ClientHistoryEvents.AddAsync(historyEvent, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await dbContext.SaveChangesAsync(cancellationToken);

    // --- ISchedulingDataStore ---

    public async Task<SalonTenant?> GetSalonAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => await dbContext.SalonTenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == tenantId, cancellationToken);

    public async Task<IReadOnlyList<SalonBusinessHour>> GetBusinessHoursAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => await dbContext.SalonBusinessHours
            .Where(h => h.TenantId == tenantId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ProfessionalWeeklyAvailability>> GetProfessionalAvailabilityAsync(Guid professionalId, CancellationToken cancellationToken = default)
        => await dbContext.ProfessionalWeeklyAvailabilities
            .Where(a => a.ProfessionalId == professionalId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<SalonBlock>> GetSalonBlocksInWindowAsync(Guid tenantId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default)
        => await dbContext.SalonBlocks
            .Where(b => b.TenantId == tenantId &&
                b.StartAtUtc < end && b.EndAtUtc > start)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ProfessionalAbsence>> GetActiveAbsencesInWindowAsync(Guid professionalId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default)
        => await dbContext.ProfessionalAbsences
            .Where(a => a.ProfessionalId == professionalId &&
                a.Status == RecordStatus.Active &&
                a.StartAtUtc < end && a.EndAtUtc > start)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsInWindowAsync(Guid professionalId, DateTimeOffset start, DateTimeOffset end, Guid? excludeId, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Appointments
            .Where(a => a.ProfessionalId == professionalId &&
                a.Status == AppointmentStatus.Scheduled &&
                a.StartAtUtc < end && a.EndAtUtc > start);

        if (excludeId.HasValue)
        {
            query = query.Where(a => a.Id != excludeId.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Professional?> GetProfessionalAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.Professionals.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<Domain.Entities.Service?> GetServiceAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.Services.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<Client?> GetClientAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.Clients.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    private static void ThrowConflictException(AppointmentConflictError conflict)
    {
        var conflictCode = conflict.ConflictType switch
        {
            AvailabilityConflictType.OutsideBusinessHours => "business_hours",
            AvailabilityConflictType.OutsideProfessionalAvailability => "professional_availability",
            AvailabilityConflictType.SalonBlock => "salon_block",
            AvailabilityConflictType.ProfessionalAbsence => "professional_absence",
            AvailabilityConflictType.ExistingAppointment => "existing_appointment",
            _ => "unknown"
        };

        var details = new Dictionary<string, object?>
        {
            ["conflictType"] = conflictCode,
            ["blockStart"] = conflict.BlockStart,
            ["blockEnd"] = conflict.BlockEnd,
            ["resourceId"] = conflict.ResourceId,
            ["resourceName"] = conflict.ResourceName
        };

        throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.AppointmentConflict,
            $"Conflito de agendamento: {conflictCode}.",
            409,
            details));
    }
}
