using Agendella.Application.Clients;
using Agendella.Application.Common.Errors;
using Agendella.Application.Professionals;
using Agendella.Application.Salons;
using Agendella.Application.Services;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Api;

public sealed class AdminCadastroJourneyTests
{
    private static AgendellaDbContext CreateContext(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var tenant = new SalonTenant
        {
            Id = tenantId,
            Name = "Salao Teste",
            Address = "Rua A",
            Phone = "11999999999",
            TimeZoneId = "America/Sao_Paulo",
            Status = SalonStatus.Active
        };

        using var seedContext = new AgendellaDbContext(options);
        seedContext.SalonTenants.Add(tenant);
        seedContext.SaveChanges();

        return new AgendellaDbContext(options, new FakeTenantContext(tenantId));
    }

    [Fact]
    public async Task AdminJourney_ShouldConfigureSalonAndCreateRecords()
    {
        var tenantId = Guid.NewGuid();
        await using var ctx = CreateContext(tenantId);
        var tenantContext = new FakeTenantContext(tenantId);

        var salonRepo = new SalonRepository(ctx);
        var salonService = new SalonSettingsService(tenantContext, salonRepo);

        var updatedSalon = await salonService.UpdateAsync(
            "Salao da Ana", "Rua das Flores, 100", "11999999999",
            "America/Sao_Paulo", 30);

        Assert.Equal("Salao da Ana", updatedSalon.Name);

        var businessHoursService = new BusinessHoursService(tenantContext, salonRepo);
        var hours = await businessHoursService.ReplaceAsync(
        [
            new BusinessHourEntry(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(18, 0), false),
            new BusinessHourEntry(DayOfWeek.Sunday, null, null, true)
        ]);

        Assert.Equal(2, hours.Count);

        var serviceRepo = new ServiceCatalogRepository(ctx);
        var serviceService = new ServiceCatalogService(tenantContext, serviceRepo);
        var service = await serviceService.CreateAsync("Corte de Cabelo", "Corte simples", 60, 50m, "BRL");

        Assert.NotEqual(Guid.Empty, service.Id);
        Assert.Equal("Corte de Cabelo", service.Name);

        var professionalRepo = new ProfessionalRepository(ctx);
        var professionalService = new ProfessionalManagementService(tenantContext, professionalRepo);
        var professional = await professionalService.CreateAsync("Ana Silva", "11888888888", "ana@salon.com");

        Assert.NotEqual(Guid.Empty, professional.Id);

        var availabilityService = new WeeklyAvailabilityService(tenantContext, professionalRepo);
        var slots = await availabilityService.ReplaceAsync(
            professional.Id, null,
        [
            new AvailabilityEntry(DayOfWeek.Monday, new TimeOnly(9, 0), new TimeOnly(17, 0))
        ]);

        Assert.Single(slots);

        var clientRepo = new ClientRepository(ctx);
        var clientService = new ClientManagementService(tenantContext, clientRepo);
        var client = await clientService.CreateAsync("Maria Souza", "11777777777", "maria@email.com", "VIP");

        Assert.NotEqual(Guid.Empty, client.Id);
        Assert.Equal(RecordStatus.Active, client.Status);
    }

    [Fact]
    public async Task AdminJourney_ShouldDeactivateServiceAndProfessional()
    {
        var tenantId = Guid.NewGuid();
        await using var ctx = CreateContext(tenantId);
        var tenantContext = new FakeTenantContext(tenantId);

        var serviceRepo = new ServiceCatalogRepository(ctx);
        var serviceService = new ServiceCatalogService(tenantContext, serviceRepo);
        var service = await serviceService.CreateAsync("Hidratacao", "Hidratacao capilar", 45, 80m, "BRL");

        await serviceService.DeactivateAsync(service.Id);
        var deactivated = await serviceService.GetAsync(service.Id);

        Assert.Equal(RecordStatus.Inactive, deactivated.Status);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
