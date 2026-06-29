using Agendella.Application.Common.Errors;
using Agendella.Application.Scheduling;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Api;

public sealed class ProfessionalAbsenceAuthorizationTests
{
    private static (AgendellaDbContext ctx, Guid tenantId, Guid profAId, Guid profBId)
        BuildContext()
    {
        var tenantId = Guid.NewGuid();
        var profAId = Guid.NewGuid();
        var profBId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(new SalonTenant
        {
            Id = tenantId, Name = "S", Address = "A", Phone = "1",
            TimeZoneId = "America/Sao_Paulo", Status = SalonStatus.Active
        });
        seed.Professionals.AddRange(
            new Professional { Id = profAId, TenantId = tenantId, Name = "Ana", Phone = "1", Email = "a@s.com", Status = RecordStatus.Active },
            new Professional { Id = profBId, TenantId = tenantId, Name = "Beth", Phone = "2", Email = "b@s.com", Status = RecordStatus.Active });
        seed.SaveChanges();

        return (new AgendellaDbContext(options, new FakeTenantContext(tenantId)), tenantId, profAId, profBId);
    }

    [Fact]
    public async Task Profissional_ShouldNotBeAbleToCreateAbsenceForAnotherProfessional()
    {
        var (ctx, tenantId, profAId, profBId) = BuildContext();
        await using var _ = ctx;

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = start.AddHours(4);

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await service.CreateAsync(profBId, start, end, "Ferias", Guid.NewGuid(), profAId));

        Assert.Equal(ErrorCodes.Forbidden, ex.Error.Code);
        Assert.Equal(403, ex.Error.StatusCode);
    }

    [Fact]
    public async Task Profissional_ShouldBeAbleToCreateOwnAbsence()
    {
        var (ctx, tenantId, profAId, _) = BuildContext();
        await using var _ = ctx;

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = start.AddHours(4);

        var absence = await service.CreateAsync(profAId, start, end, "Consulta", Guid.NewGuid(), profAId);

        Assert.NotEqual(Guid.Empty, absence.Id);
        Assert.Equal(profAId, absence.ProfessionalId);
        Assert.Equal(RecordStatus.Active, absence.Status);
    }

    [Fact]
    public async Task Admin_ShouldBeAbleToCreateAbsenceForAnyProfessional()
    {
        var (ctx, tenantId, _, profBId) = BuildContext();
        await using var _ = ctx;

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = start.AddHours(4);

        // Admin has no professional_id in claims (requesterProfessionalId = null)
        var absence = await service.CreateAsync(profBId, start, end, "Treinamento", Guid.NewGuid(), null);

        Assert.Equal(profBId, absence.ProfessionalId);
    }

    [Fact]
    public async Task Profissional_ShouldNotBeAbleToCancelAnothersProfessionalsAbsence()
    {
        var (ctx, tenantId, profAId, profBId) = BuildContext();
        await using var _ = ctx;

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = start.AddHours(4);

        var absence = await service.CreateAsync(profBId, start, end, "Ferias", Guid.NewGuid(), null);

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await service.CancelAsync(profBId, absence.Id, profAId));

        Assert.Equal(ErrorCodes.Forbidden, ex.Error.Code);
    }

    [Fact]
    public async Task Profissional_ShouldBeAbleToCancelOwnAbsence()
    {
        var (ctx, tenantId, profAId, _) = BuildContext();
        await using var _ = ctx;

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = start.AddHours(4);

        var absence = await service.CreateAsync(profAId, start, end, "Viagem", Guid.NewGuid(), profAId);
        await service.CancelAsync(profAId, absence.Id, profAId);

        var updated = await ctx.ProfessionalAbsences.FindAsync(absence.Id);
        Assert.Equal(RecordStatus.Inactive, updated!.Status);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
