namespace Agendella.Api.Contracts.Services;

public sealed record UpdateServiceRequest(
    string Name,
    string Description,
    int DurationMinutes,
    decimal PriceAmount,
    string Currency);
