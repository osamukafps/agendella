using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class ClientHistoryEvent : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ClientId { get; set; }

    public Guid? AppointmentId { get; set; }

    public ClientHistoryEventType Type { get; set; }

    public DateTimeOffset OccurredAtUtc { get; set; }

    public string Description { get; set; } = string.Empty;

    public Guid CreatedByCollaboratorId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public Client? Client { get; set; }

    public Appointment? Appointment { get; set; }

    public SalonCollaborator? CreatedByCollaborator { get; set; }
}
