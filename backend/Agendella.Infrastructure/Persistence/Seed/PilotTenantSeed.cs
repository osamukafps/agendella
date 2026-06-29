using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Infrastructure.Persistence.Seed;

public static class PilotTenantSeed
{
    public static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public static SalonTenant Create() => new()
    {
        Id = TenantId,
        Name = "Salao Piloto",
        Address = string.Empty,
        Phone = string.Empty,
        TimeZoneId = "America/Sao_Paulo",
        Status = SalonStatus.Active,
        MinimumCancellationNoticeMinutes = 0,
        CreatedAtUtc = DateTimeOffset.UtcNow,
        UpdatedAtUtc = DateTimeOffset.UtcNow
    };
}
