using Agendella.Domain.Entities;

namespace Agendella.Application.Scheduling;

public interface ISalonBlockStore
{
    Task<SalonBlock?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<SalonBlock> Items, string? NextCursor)> ListAsync(int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task AddAsync(SalonBlock block, CancellationToken cancellationToken = default);
    Task DeleteAsync(SalonBlock block, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsOverlappingAsync(Guid tenantId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default);
    Task MarkRequiresReviewAsync(IReadOnlyList<Appointment> appointments, string reason, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
