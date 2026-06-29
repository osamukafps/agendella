using Agendella.Domain.Common;

namespace Agendella.Domain.Entities;

public class ProfessionalWeeklyAvailability : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public Guid ProfessionalId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly StartLocalTime { get; set; }

    public TimeOnly EndLocalTime { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public Professional? Professional { get; set; }
}
