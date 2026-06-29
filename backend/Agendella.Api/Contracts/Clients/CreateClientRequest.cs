namespace Agendella.Api.Contracts.Clients;

public sealed record CreateClientRequest(
    string Name,
    string Phone,
    string Email,
    string Notes);
