namespace Agendella.Api.Contracts.Salons;

public sealed record BusinessHourDto(
    string DayOfWeek,
    string? StartLocalTime,
    string? EndLocalTime,
    bool IsClosed);

public sealed record ReplaceBusinessHoursRequest(IReadOnlyList<BusinessHourDto> BusinessHours);
