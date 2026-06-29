using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Infrastructure;

public sealed class EntityMappingTests
{
    private readonly AgendellaDbContext _dbContext;

    public EntityMappingTests()
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=agendella_dev;Username=agendella;Password=agendella")
            .Options;

        _dbContext = new AgendellaDbContext(options);
    }

    [Fact]
    public void Client_Mapping_ShouldContainUniquePhoneIndexPerTenant()
    {
        var entityType = _dbContext.Model.FindEntityType(typeof(Client));

        Assert.NotNull(entityType);
        Assert.Contains(entityType!.GetIndexes(), index =>
            index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual([nameof(Client.TenantId), nameof(Client.Phone)]));
    }

    [Fact]
    public void SalonCollaborator_Mapping_ShouldContainUniqueEmailIndexPerTenant()
    {
        var entityType = _dbContext.Model.FindEntityType(typeof(SalonCollaborator));

        Assert.NotNull(entityType);
        Assert.Contains(entityType!.GetIndexes(), index =>
            index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual([nameof(SalonCollaborator.TenantId), nameof(SalonCollaborator.Email)]));
    }

    [Fact]
    public void Appointment_Mapping_ShouldRequireStatusAndTimestamps()
    {
        var entityType = _dbContext.Model.FindEntityType(typeof(Appointment));

        Assert.NotNull(entityType);
        Assert.False(entityType!.FindProperty(nameof(Appointment.Status))!.IsNullable);
        Assert.False(entityType.FindProperty(nameof(Appointment.CreatedAtUtc))!.IsNullable);
        Assert.False(entityType.FindProperty(nameof(Appointment.UpdatedAtUtc))!.IsNullable);
    }
}
