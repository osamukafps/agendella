namespace Agendella.Api.Contracts.Salons;

public sealed record UpdateSalonSettingsRequest(
    string Name,
    string Address,
    string Phone,
    string TimeZoneId,
    int MinimumCancellationNoticeMinutes);
