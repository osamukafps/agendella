using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class Professional : Entity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SalonTenant? Tenant { get; set; }

    public ICollection<ProfessionalWeeklyAvailability> WeeklyAvailabilities { get; set; } = new List<ProfessionalWeeklyAvailability>();

    public ICollection<ProfessionalAbsence> Absences { get; set; } = new List<ProfessionalAbsence>();

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
