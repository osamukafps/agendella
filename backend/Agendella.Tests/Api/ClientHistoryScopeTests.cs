using Agendella.Application.Clients;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Api;

public sealed class ClientHistoryScopeTests
{
    private static (AgendellaDbContext context, Client client, Guid professionalId) CreateContextWithHistory(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var client = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Maria",
            Phone = "11999999999",
            Status = RecordStatus.Active
        };

        var professionalId = Guid.NewGuid();
        var anotherProfessionalId = Guid.NewGuid();

        var collaboratorId = Guid.NewGuid();

        var historyEventForProfessional = new ClientHistoryEvent
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClientId = client.Id,
            AppointmentId = null,
            Type = ClientHistoryEventType.AppointmentCreated,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = "Evento de Ana",
            CreatedByCollaboratorId = collaboratorId
        };

        using var seedContext = new AgendellaDbContext(options);
        seedContext.Clients.Add(client);
        seedContext.ClientHistoryEvents.Add(historyEventForProfessional);
        seedContext.SaveChanges();

        var ctx = new AgendellaDbContext(options, new FakeTenantContext(tenantId));
        return (ctx, client, professionalId);
    }

    [Fact]
    public async Task Administradora_ShouldSeeAllClientHistory()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, client, _) = CreateContextWithHistory(tenantId);
        await using var _ = ctx;

        var repo = new ClientRepository(ctx);
        var service = new ClientManagementService(new FakeTenantContext(tenantId), repo);

        var (items, _) = await service.GetHistoryAsync(client.Id, null, 20, null);

        Assert.Single(items);
    }

    [Fact]
    public async Task ClientService_GetAsync_ShouldReturnClientInSameTenant()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, client, _) = CreateContextWithHistory(tenantId);
        await using var _ = ctx;

        var repo = new ClientRepository(ctx);
        var service = new ClientManagementService(new FakeTenantContext(tenantId), repo);

        var found = await service.GetAsync(client.Id);

        Assert.Equal(client.Id, found.Id);
        Assert.Equal("Maria", found.Name);
    }

    [Fact]
    public async Task ClientService_List_ShouldReturnClientsForTenant()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, _) = CreateContextWithHistory(tenantId);
        await using var _ = ctx;

        var repo = new ClientRepository(ctx);
        var service = new ClientManagementService(new FakeTenantContext(tenantId), repo);

        var (items, nextCursor) = await service.ListAsync(20, null);

        Assert.Single(items);
        Assert.Null(nextCursor);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
