using Agendella.Domain.Common;

namespace Agendella.Domain.Entities;

public class RefreshTokenSession : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid CollaboratorId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public Guid FamilyId { get; set; } = Guid.NewGuid();

    public DateTimeOffset ExpiresAtUtc { get; set; }

    public DateTimeOffset? RotatedAtUtc { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }

    public Guid? ReplacedByTokenId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public string UserAgent { get; set; } = string.Empty;

    public string IpAddress { get; set; } = string.Empty;

    public SalonTenant? Tenant { get; set; }

    public SalonCollaborator? Collaborator { get; set; }
}
