namespace Agendella.Domain.Enums;

public enum ClientHistoryEventType
{
    AppointmentCreated = 1,
    Rescheduled = 2,
    Cancelled = 3,
    LateCancelled = 4,
    NoShow = 5,
    ReviewRequired = 6,
    ReviewResolved = 7,
    Completed = 8
}
