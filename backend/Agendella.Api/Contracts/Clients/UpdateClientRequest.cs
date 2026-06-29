namespace Agendella.Api.Contracts.Clients;

public sealed record UpdateClientRequest(
    string Name,
    string Phone,
    string Email,
    string Notes);
