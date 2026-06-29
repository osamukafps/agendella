using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Application;

public sealed class TenantLookupSecurityTests
{
    [Fact]
    public void Lookup_ByIdFromAnotherTenant_ShouldReturnNull()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var foreignClientId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using (var seedContext = new AgendellaDbContext(options, new FakeTenantContext(null)))
        {
            seedContext.Clients.AddRange(
                new Client { TenantId = tenantA, Name = "Cliente A", Phone = "111", Status = RecordStatus.Active },
                new Client { Id = foreignClientId, TenantId = tenantB, Name = "Cliente B", Phone = "222", Status = RecordStatus.Active });
            seedContext.SaveChanges();
        }

        using var scopedContext = new AgendellaDbContext(options, new FakeTenantContext(tenantA));
        var result = scopedContext.Clients.SingleOrDefault(client => client.Id == foreignClientId);

        Assert.Null(result);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;

        public bool HasTenant => TenantId.HasValue;
    }
}
