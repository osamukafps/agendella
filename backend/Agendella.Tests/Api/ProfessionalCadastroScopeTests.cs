using Agendella.Application.Common.Errors;
using Agendella.Application.Professionals;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Api;

public sealed class ProfessionalCadastroScopeTests
{
    private static (AgendellaDbContext context, Professional professional) CreateContextWithProfessional(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var professional = new Professional
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Ana Silva",
            Phone = "11999999999",
            Email = "ana@salon.com",
            Status = RecordStatus.Active
        };

        var anotherProfessional = new Professional
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Maria Costa",
            Phone = "11888888888",
            Email = "maria@salon.com",
            Status = RecordStatus.Active
        };

        using var seedContext = new AgendellaDbContext(options);
        seedContext.Professionals.AddRange(professional, anotherProfessional);
        seedContext.SaveChanges();

        var ctx = new AgendellaDbContext(options, new FakeTenantContext(tenantId));
        return (ctx, professional);
    }

    [Fact]
    public async Task Profissional_ShouldBeAbleToGetOwnWeeklyAvailability()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, professional) = CreateContextWithProfessional(tenantId);
        await using var _ = ctx;

        var repo = new ProfessionalRepository(ctx);
        var service = new WeeklyAvailabilityService(new FakeTenantContext(tenantId), repo);

        var slots = await service.GetAsync(professional.Id, professional.Id);

        Assert.Empty(slots);
    }

    [Fact]
    public async Task Profissional_ShouldNotBeAbleToGetAnotherProfessionalsAvailability()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, professional) = CreateContextWithProfessional(tenantId);
        await using var _ = ctx;

        var repo = new ProfessionalRepository(ctx);
        var tenantContext = new FakeTenantContext(tenantId);
        var service = new WeeklyAvailabilityService(tenantContext, repo);

        var allProfessionals = await repo.ListAsync(10, null);
        var anotherProfessional = allProfessionals.Items.First(p => p.Id != professional.Id);

        var exception = await Assert.ThrowsAsync<ApplicationRuleException>(() =>
            service.GetAsync(anotherProfessional.Id, professional.Id));

        Assert.Equal(ErrorCodes.Forbidden, exception.Error.Code);
        Assert.Equal(403, exception.Error.StatusCode);
    }

    [Fact]
    public async Task Profissional_ShouldBeAbleToReplaceOwnWeeklyAvailability()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, professional) = CreateContextWithProfessional(tenantId);
        await using var _ = ctx;

        var repo = new ProfessionalRepository(ctx);
        var service = new WeeklyAvailabilityService(new FakeTenantContext(tenantId), repo);

        var slots = await service.ReplaceAsync(
            professional.Id,
            professional.Id,
        [
            new AvailabilityEntry(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(17, 0))
        ]);

        Assert.Single(slots);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
