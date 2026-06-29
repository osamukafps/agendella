namespace Agendella.Api.Contracts.Professionals;

public sealed record ProfessionalResponse(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
