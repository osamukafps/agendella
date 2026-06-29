namespace Agendella.Api.Contracts.Auth;

public sealed record MeResponse(
    Guid CollaboratorId,
    Guid TenantId,
    Guid? ProfessionalId,
    string Role,
    string Status);
