using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class SalonCollaborator : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public CollaboratorRole Role { get; set; } = CollaboratorRole.Profissional;

    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public Guid? ProfessionalId { get; set; }

    public int TokenVersion { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public Professional? Professional { get; set; }

    public ICollection<RefreshTokenSession> RefreshTokenSessions { get; set; } = new List<RefreshTokenSession>();
}
