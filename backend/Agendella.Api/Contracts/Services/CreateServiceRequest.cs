namespace Agendella.Api.Contracts.Services;

public sealed record CreateServiceRequest(
    string Name,
    string Description,
    int DurationMinutes,
    decimal PriceAmount,
    string Currency);
