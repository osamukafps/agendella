using Agendella.Domain.Entities;
using Agendella.Domain.Scheduling;

namespace Agendella.Application.Scheduling;

public sealed record AppointmentConflictError(
    AvailabilityConflictType ConflictType,
    DateTimeOffset? BlockStart,
    DateTimeOffset? BlockEnd,
    Guid? ResourceId,
    string? ResourceName);

public interface IAppointmentStore
{
    Task<Appointment?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Appointment> Items, string? NextCursor)> ListAsync(Guid? professionalId, int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task CreateAsync(Appointment appointment, AppointmentConflictError? existingConflict, CancellationToken cancellationToken = default);
    Task UpdateAsync(Appointment appointment, AppointmentConflictError? existingConflict, CancellationToken cancellationToken = default);
    Task AddHistoryEventAsync(ClientHistoryEvent historyEvent, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
