using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class Appointment : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ClientId { get; set; }

    public Guid ProfessionalId { get; set; }

    public Guid ServiceId { get; set; }

    public DateTimeOffset StartAtUtc { get; set; }

    public DateTimeOffset EndAtUtc { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

    public bool RequiresReview { get; set; }

    public string? ReviewReason { get; set; }

    public Guid CreatedByCollaboratorId { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public Client? Client { get; set; }

    public Professional? Professional { get; set; }

    public Service? Service { get; set; }

    public SalonCollaborator? CreatedByCollaborator { get; set; }

    public ICollection<ClientHistoryEvent> HistoryEvents { get; set; } = new List<ClientHistoryEvent>();
}
