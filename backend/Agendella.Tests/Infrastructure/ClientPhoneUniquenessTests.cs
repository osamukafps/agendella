using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Infrastructure;

public sealed class ClientPhoneUniquenessTests
{
    [Fact]
    public void Client_Mapping_ShouldEnforceUniquePhonePerTenant()
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=agendella_dev;Username=agendella;Password=agendella")
            .Options;

        using var dbContext = new AgendellaDbContext(options);

        var entityType = dbContext.Model.FindEntityType(typeof(Client));
        var uniqueIndex = entityType!.GetIndexes().Single(index =>
            index.Properties.Select(property => property.Name).SequenceEqual([nameof(Client.TenantId), nameof(Client.Phone)]));

        Assert.True(uniqueIndex.IsUnique);
    }
}
