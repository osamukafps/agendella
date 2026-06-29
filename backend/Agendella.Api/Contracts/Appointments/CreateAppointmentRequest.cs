namespace Agendella.Api.Contracts.Appointments;

public sealed record CreateAppointmentRequest(
    Guid ClientId,
    Guid ProfessionalId,
    Guid ServiceId,
    DateTimeOffset StartAtUtc,
    DateTimeOffset? ManualEndAtUtc);
