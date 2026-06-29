using Agendella.Domain.Entities;

namespace Agendella.Application.Professionals;

public interface IProfessionalStore
{
    Task<Professional?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Professional> Items, string? NextCursor)> ListAsync(int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task AddAsync(Professional professional, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProfessionalWeeklyAvailability>> GetWeeklyAvailabilityAsync(Guid professionalId, CancellationToken cancellationToken = default);
    Task ReplaceWeeklyAvailabilityAsync(Guid professionalId, Guid tenantId, IReadOnlyList<ProfessionalWeeklyAvailability> slots, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
