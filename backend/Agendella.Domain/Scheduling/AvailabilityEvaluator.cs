using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Domain.Scheduling;

public static class AvailabilityEvaluator
{
    public static AvailabilityConflict? Evaluate(
        DateTimeOffset proposedStart,
        DateTimeOffset proposedEnd,
        string salonTimeZoneId,
        IReadOnlyList<SalonBusinessHour> businessHours,
        IReadOnlyList<ProfessionalWeeklyAvailability> professionalAvailabilities,
        IReadOnlyList<SalonBlock> salonBlocks,
        IReadOnlyList<ProfessionalAbsence> absences,
        IReadOnlyList<Appointment> existingAppointments,
        Guid? excludeAppointmentId = null)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(salonTimeZoneId);
        var localStart = TimeZoneInfo.ConvertTimeFromUtc(proposedStart.UtcDateTime, tz);
        var localDayOfWeek = localStart.DayOfWeek;
        var localStartTime = TimeOnly.FromTimeSpan(localStart.TimeOfDay);

        var businessHour = businessHours.FirstOrDefault(h => h.DayOfWeek == localDayOfWeek);
        if (businessHour is null || businessHour.IsClosed ||
            businessHour.StartLocalTime is null || businessHour.EndLocalTime is null ||
            localStartTime < businessHour.StartLocalTime || localStartTime >= businessHour.EndLocalTime)
        {
            return new AvailabilityConflict(AvailabilityConflictType.OutsideBusinessHours);
        }

        var profAvailability = professionalAvailabilities.FirstOrDefault(a => a.DayOfWeek == localDayOfWeek);
        if (profAvailability is null ||
            localStartTime < profAvailability.StartLocalTime || localStartTime >= profAvailability.EndLocalTime)
        {
            return new AvailabilityConflict(AvailabilityConflictType.OutsideProfessionalAvailability);
        }

        foreach (var block in salonBlocks)
        {
            if (AppointmentWindow.Overlaps(proposedStart, proposedEnd, block.StartAtUtc, block.EndAtUtc))
            {
                return new AvailabilityConflict(
                    AvailabilityConflictType.SalonBlock,
                    block.StartAtUtc, block.EndAtUtc,
                    block.Id, block.Reason);
            }
        }

        foreach (var absence in absences)
        {
            if (absence.Status == RecordStatus.Active &&
                AppointmentWindow.Overlaps(proposedStart, proposedEnd, absence.StartAtUtc, absence.EndAtUtc))
            {
                return new AvailabilityConflict(
                    AvailabilityConflictType.ProfessionalAbsence,
                    absence.StartAtUtc, absence.EndAtUtc,
                    absence.Id, absence.Reason);
            }
        }

        foreach (var appointment in existingAppointments)
        {
            if (appointment.Status != AppointmentStatus.Scheduled) continue;
            if (excludeAppointmentId.HasValue && appointment.Id == excludeAppointmentId.Value) continue;
            if (AppointmentWindow.Overlaps(proposedStart, proposedEnd, appointment.StartAtUtc, appointment.EndAtUtc))
            {
                return new AvailabilityConflict(
                    AvailabilityConflictType.ExistingAppointment,
                    appointment.StartAtUtc, appointment.EndAtUtc,
                    appointment.Id);
            }
        }

        return null;
    }

    public static IReadOnlyList<(DateTimeOffset Start, DateTimeOffset End)> GenerateSlots(
        DateOnly date,
        string salonTimeZoneId,
        IReadOnlyList<SalonBusinessHour> businessHours,
        IReadOnlyList<ProfessionalWeeklyAvailability> professionalAvailabilities,
        IReadOnlyList<SalonBlock> salonBlocks,
        IReadOnlyList<ProfessionalAbsence> absences,
        IReadOnlyList<Appointment> existingAppointments,
        int durationMinutes,
        int slotIncrementMinutes = 15)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(salonTimeZoneId);
        var dayOfWeek = date.DayOfWeek;

        var businessHour = businessHours.FirstOrDefault(h => h.DayOfWeek == dayOfWeek);
        if (businessHour is null || businessHour.IsClosed ||
            businessHour.StartLocalTime is null || businessHour.EndLocalTime is null)
        {
            return [];
        }

        var profAvailability = professionalAvailabilities.FirstOrDefault(a => a.DayOfWeek == dayOfWeek);
        if (profAvailability is null)
        {
            return [];
        }

        var effectiveStart = businessHour.StartLocalTime.Value > profAvailability.StartLocalTime
            ? businessHour.StartLocalTime.Value
            : profAvailability.StartLocalTime;

        var effectiveEnd = businessHour.EndLocalTime.Value < profAvailability.EndLocalTime
            ? businessHour.EndLocalTime.Value
            : profAvailability.EndLocalTime;

        if (effectiveStart >= effectiveEnd)
        {
            return [];
        }

        var slots = new List<(DateTimeOffset, DateTimeOffset)>();
        var localDay = date.ToDateTime(effectiveStart);
        var slotStart = TimeZoneInfo.ConvertTimeToUtc(localDay, tz);
        var localDayEnd = date.ToDateTime(effectiveEnd);
        var dayEndUtc = TimeZoneInfo.ConvertTimeToUtc(localDayEnd, tz);

        while (slotStart.AddMinutes(durationMinutes) <= dayEndUtc)
        {
            var slotEnd = slotStart.AddMinutes(durationMinutes);
            var conflict = Evaluate(
                slotStart, slotEnd,
                salonTimeZoneId,
                businessHours, professionalAvailabilities,
                salonBlocks, absences, existingAppointments);

            if (conflict is null)
            {
                slots.Add((slotStart, slotEnd));
            }

            slotStart = slotStart.AddMinutes(slotIncrementMinutes);
        }

        return slots;
    }
}
