namespace Agendella.Api.Contracts.Availability;

public sealed record AvailabilitySlotDto(DateTimeOffset StartAtUtc, DateTimeOffset EndAtUtc);

public sealed record AvailabilityResponse(
    Guid ProfessionalId,
    DateOnly Date,
    int DurationMinutes,
    IReadOnlyList<AvailabilitySlotDto> Slots);
