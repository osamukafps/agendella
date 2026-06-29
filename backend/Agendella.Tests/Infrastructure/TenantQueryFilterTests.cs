using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Infrastructure;

public sealed class TenantQueryFilterTests
{
    [Fact]
    public void QueryFilters_ShouldHideRowsFromOtherTenants()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var fakeContext = new FakeTenantContext(tenantA);

        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using (var seedContext = new AgendellaDbContext(options, new FakeTenantContext(null)))
        {
            seedContext.Clients.AddRange(
                new Client { TenantId = tenantA, Name = "Cliente A", Phone = "111", Status = RecordStatus.Active },
                new Client { TenantId = tenantB, Name = "Cliente B", Phone = "222", Status = RecordStatus.Active });
            seedContext.SaveChanges();
        }

        using var scopedContext = new AgendellaDbContext(options, fakeContext);
        var visibleClients = scopedContext.Clients.ToList();

        Assert.Single(visibleClients);
        Assert.All(visibleClients, client => Assert.Equal(tenantA, client.TenantId));
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;

        public bool HasTenant => TenantId.HasValue;
    }
}
