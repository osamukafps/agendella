using Agendella.Domain.Common;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Entities;

public class SalonTenant : Entity
{
    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string TimeZoneId { get; set; } = "America/Sao_Paulo";

    public SalonStatus Status { get; set; } = SalonStatus.Active;

    public int MinimumCancellationNoticeMinutes { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<SalonBusinessHour> BusinessHours { get; set; } = new List<SalonBusinessHour>();

    public ICollection<SalonCollaborator> Collaborators { get; set; } = new List<SalonCollaborator>();

    public ICollection<Professional> Professionals { get; set; } = new List<Professional>();

    public ICollection<Service> Services { get; set; } = new List<Service>();

    public ICollection<Client> Clients { get; set; } = new List<Client>();

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<SalonBlock> SalonBlocks { get; set; } = new List<SalonBlock>();

    public ICollection<ProfessionalAbsence> ProfessionalAbsences { get; set; } = new List<ProfessionalAbsence>();

    public ICollection<ClientHistoryEvent> ClientHistoryEvents { get; set; } = new List<ClientHistoryEvent>();
}
