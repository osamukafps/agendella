namespace Agendella.Api.Contracts.Appointments;

public sealed record RescheduleAppointmentRequest(
    DateTimeOffset NewStartAtUtc,
    DateTimeOffset? NewManualEndAtUtc);
