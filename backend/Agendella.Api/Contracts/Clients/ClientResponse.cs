namespace Agendella.Api.Contracts.Clients;

public sealed record ClientResponse(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string Notes,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
