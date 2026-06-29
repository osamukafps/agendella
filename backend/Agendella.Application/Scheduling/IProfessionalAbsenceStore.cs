using Agendella.Domain.Entities;

namespace Agendella.Application.Scheduling;

public interface IProfessionalAbsenceStore
{
    Task<ProfessionalAbsence?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<ProfessionalAbsence> Items, string? NextCursor)> ListAsync(Guid professionalId, int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task AddAsync(ProfessionalAbsence absence, CancellationToken cancellationToken = default);
    Task<Professional?> GetProfessionalAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsOverlappingAsync(Guid professionalId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default);
    Task MarkRequiresReviewAsync(IReadOnlyList<Appointment> appointments, string reason, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
