namespace Agendella.Api.Contracts.ProfessionalAbsences;

public sealed record ProfessionalAbsenceResponse(
    Guid Id,
    Guid ProfessionalId,
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string Reason,
    string Status,
    DateTimeOffset? CancelledAtUtc,
    DateTimeOffset CreatedAtUtc);
