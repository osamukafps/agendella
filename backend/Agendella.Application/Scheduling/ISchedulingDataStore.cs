using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Scheduling;

public interface ISchedulingDataStore
{
    Task<SalonTenant?> GetSalonAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalonBusinessHour>> GetBusinessHoursAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProfessionalWeeklyAvailability>> GetProfessionalAvailabilityAsync(Guid professionalId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalonBlock>> GetSalonBlocksInWindowAsync(Guid tenantId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProfessionalAbsence>> GetActiveAbsencesInWindowAsync(Guid professionalId, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Appointment>> GetScheduledAppointmentsInWindowAsync(Guid professionalId, DateTimeOffset start, DateTimeOffset end, Guid? excludeId, CancellationToken cancellationToken = default);
    Task<Professional?> GetProfessionalAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Domain.Entities.Service?> GetServiceAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Client?> GetClientAsync(Guid id, CancellationToken cancellationToken = default);
}
