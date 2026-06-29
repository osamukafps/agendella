namespace Agendella.Api.Contracts.Professionals;

public sealed record WeeklyAvailabilityEntryDto(
    string DayOfWeek,
    string StartLocalTime,
    string EndLocalTime);

public sealed record ReplaceWeeklyAvailabilityRequest(IReadOnlyList<WeeklyAvailabilityEntryDto> Slots);

public sealed record WeeklyAvailabilityResponse(IReadOnlyList<WeeklyAvailabilityEntryDto> Slots);
