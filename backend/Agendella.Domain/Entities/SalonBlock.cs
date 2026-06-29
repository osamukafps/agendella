using Agendella.Domain.Common;

namespace Agendella.Domain.Entities;

public class SalonBlock : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public DateTimeOffset StartAtUtc { get; set; }

    public DateTimeOffset EndAtUtc { get; set; }

    public string Reason { get; set; } = string.Empty;

    public Guid CreatedByCollaboratorId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public SalonCollaborator? CreatedByCollaborator { get; set; }
}
