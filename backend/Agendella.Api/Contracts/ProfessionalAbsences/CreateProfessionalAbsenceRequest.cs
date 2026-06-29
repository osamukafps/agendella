namespace Agendella.Api.Contracts.ProfessionalAbsences;

public sealed record CreateProfessionalAbsenceRequest(
    Guid ProfessionalId,
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string Reason);
