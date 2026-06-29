using Agendella.Application.Auth;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Infrastructure.Persistence.Seed;

public static class PilotAdminSeed
{
    public static readonly Guid CollaboratorId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static SalonCollaborator Create(IPasswordHasher passwordHasher)
    {
        var password = Environment.GetEnvironmentVariable("AGENDLLA_PILOT_ADMIN_PASSWORD")
            ?? throw new InvalidOperationException(
                "AGENDLLA_PILOT_ADMIN_PASSWORD não configurada. " +
                "Execute: export AGENDLLA_PILOT_ADMIN_PASSWORD=\"sua_senha\"");

        var collaborator = new SalonCollaborator
        {
            Id = CollaboratorId,
            TenantId = PilotTenantSeed.TenantId,
            Email = "admin@agendella.local",
            DisplayName = "Administradora Piloto",
            Role = CollaboratorRole.Administradora,
            Status = RecordStatus.Active,
            TokenVersion = 0,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        collaborator.PasswordHash = passwordHasher.HashPassword(collaborator, password);
        return collaborator;
    }
}
