namespace Agendella.Api.Contracts.Appointments;

public sealed record AppointmentResponse(
    Guid Id,
    Guid ClientId,
    Guid ProfessionalId,
    Guid ServiceId,
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string Status,
    bool RequiresReview,
    string? ReviewReason,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
