namespace Agendella.Api.Contracts.Common;

public sealed record AppointmentConflictResponse(
    string Code,
    string Message,
    AppointmentConflictDetails? Details = null);

public sealed record AppointmentConflictDetails(
    string Type,
    DateTimeOffset? StartAtUtc = null,
    DateTimeOffset? EndAtUtc = null,
    Guid? ResourceId = null,
    string? ResourceName = null);
