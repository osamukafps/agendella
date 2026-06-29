namespace Agendella.Api.Contracts.Clients;

public sealed record ClientHistoryEventResponse(
    Guid Id,
    Guid ClientId,
    Guid? AppointmentId,
    string Type,
    DateTimeOffset OccurredAtUtc,
    string Description,
    DateTimeOffset CreatedAtUtc);
