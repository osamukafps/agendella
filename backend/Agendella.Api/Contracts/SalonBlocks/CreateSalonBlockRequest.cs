namespace Agendella.Api.Contracts.SalonBlocks;

public sealed record CreateSalonBlockRequest(
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string Reason);
