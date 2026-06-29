using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class ProfessionalAbsence : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ProfessionalId { get; set; }

    public DateTimeOffset StartAtUtc { get; set; }

    public DateTimeOffset EndAtUtc { get; set; }

    public string Reason { get; set; } = string.Empty;

    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public DateTimeOffset? CancelledAtUtc { get; set; }

    public Guid CreatedByCollaboratorId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public Professional? Professional { get; set; }

    public SalonCollaborator? CreatedByCollaborator { get; set; }
}
