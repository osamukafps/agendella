namespace Agendella.Domain.Scheduling;

public static class AppointmentWindow
{
    public static DateTimeOffset ComputeEnd(
        DateTimeOffset startAtUtc,
        int serviceDurationMinutes,
        DateTimeOffset? manualEndAtUtc)
    {
        if (manualEndAtUtc.HasValue && manualEndAtUtc.Value > startAtUtc)
        {
            return manualEndAtUtc.Value;
        }

        return startAtUtc.AddMinutes(serviceDurationMinutes);
    }

    public static bool Overlaps(
        DateTimeOffset startA, DateTimeOffset endA,
        DateTimeOffset startB, DateTimeOffset endB)
    {
        return startA < endB && startB < endA;
    }

    public static bool OverlapsNonConsecutive(
        DateTimeOffset startA, DateTimeOffset endA,
        DateTimeOffset startB, DateTimeOffset endB)
    {
        return Overlaps(startA, endA, startB, endB);
    }
}
