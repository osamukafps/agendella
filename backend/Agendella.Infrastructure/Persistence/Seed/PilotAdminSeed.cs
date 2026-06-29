using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Auth;

namespace Agendella.Infrastructure.Persistence.Seed;

public static class PilotAdminSeed
{
    public static readonly Guid CollaboratorId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static SalonCollaborator Create(PasswordHasher passwordHasher)
    {
        var password = Environment.GetEnvironmentVariable("AGENDLLA_PILOT_ADMIN_PASSWORD")
            ?? throw new InvalidOperationException("AGENDLLA_PILOT_ADMIN_PASSWORD was not configured.");

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
