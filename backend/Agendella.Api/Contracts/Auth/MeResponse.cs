namespace Agendella.Api.Contracts.Auth;

public sealed record MeResponse(
    Guid CollaboratorId,
    Guid TenantId,
    Guid? ProfessionalId,
    string DisplayName,
    string Role,
    string Status,
    string SalonName);
