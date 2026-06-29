using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class Service : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public decimal PriceAmount { get; set; }

    public string Currency { get; set; } = "BRL";

    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
