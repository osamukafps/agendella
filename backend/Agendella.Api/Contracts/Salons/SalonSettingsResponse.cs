namespace Agendella.Api.Contracts.Salons;

public sealed record SalonSettingsResponse(
    Guid Id,
    string Name,
    string Address,
    string Phone,
    string TimeZoneId,
    string Status,
    int MinimumCancellationNoticeMinutes,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
