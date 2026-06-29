namespace Agendella.Domain.Scheduling;

public enum AvailabilityConflictType
{
    OutsideBusinessHours,
    OutsideProfessionalAvailability,
    SalonBlock,
    ProfessionalAbsence,
    ExistingAppointment
}

public sealed record AvailabilityConflict(
    AvailabilityConflictType Type,
    DateTimeOffset? BlockStart = null,
    DateTimeOffset? BlockEnd = null,
    Guid? ResourceId = null,
    string? ResourceName = null);
