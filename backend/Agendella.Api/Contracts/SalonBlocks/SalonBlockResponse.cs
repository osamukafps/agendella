namespace Agendella.Api.Contracts.SalonBlocks;

public sealed record SalonBlockResponse(
    Guid Id,
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string Reason,
    DateTimeOffset CreatedAtUtc);
