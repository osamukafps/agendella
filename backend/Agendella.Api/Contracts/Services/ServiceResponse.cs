namespace Agendella.Api.Contracts.Services;

public sealed record ServiceResponse(
    Guid Id,
    string Name,
    string Description,
    int DurationMinutes,
    decimal PriceAmount,
    string Currency,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
