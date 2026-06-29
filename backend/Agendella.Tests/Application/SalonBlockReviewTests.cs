using Agendella.Application.Scheduling;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Application;

public sealed class SalonBlockReviewTests
{
    private static (AgendellaDbContext ctx, Guid tenantId, Guid adminId) CreateContext()
    {
        var tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(new SalonTenant
        {
            Id = tenantId, Name = "S", Address = "A", Phone = "1",
            TimeZoneId = "America/Sao_Paulo", Status = SalonStatus.Active
        });
        seed.SaveChanges();

        return (new AgendellaDbContext(options, new FakeTenantContext(tenantId)), tenantId, Guid.NewGuid());
    }

    [Fact]
    public async Task CreateBlock_ShouldMarkOverlappingScheduledAppointments_WithRequiresReview()
    {
        var (ctx, tenantId, adminId) = CreateContext();
        await using var _ = ctx;

        var professionalId = Guid.NewGuid();
        var blockStart = new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);
        var blockEnd = blockStart.AddHours(3);

        var overlappingAppointment = new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId, ServiceId = Guid.NewGuid(),
            StartAtUtc = blockStart.AddMinutes(30), EndAtUtc = blockStart.AddHours(1),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = false, CreatedByCollaboratorId = adminId
        };

        var outsideAppointment = new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId, ServiceId = Guid.NewGuid(),
            StartAtUtc = blockEnd.AddHours(1), EndAtUtc = blockEnd.AddHours(2),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = false, CreatedByCollaboratorId = adminId
        };

        ctx.Appointments.AddRange(overlappingAppointment, outsideAppointment);
        await ctx.SaveChangesAsync();

        var repo = new SalonBlockRepository(ctx);
        var service = new SalonBlockService(new FakeTenantContext(tenantId), repo);

        await service.CreateAsync(blockStart, blockEnd, "Manutencao", adminId);

        var updatedOverlapping = await ctx.Appointments.FindAsync(overlappingAppointment.Id);
        var updatedOutside = await ctx.Appointments.FindAsync(outsideAppointment.Id);

        Assert.True(updatedOverlapping!.RequiresReview);
        Assert.Contains("Manutencao", updatedOverlapping.ReviewReason);
        Assert.False(updatedOutside!.RequiresReview);
    }

    [Fact]
    public async Task CreateBlock_ShouldNotMarkCancelledOrCompletedAppointments()
    {
        var (ctx, tenantId, adminId) = CreateContext();
        await using var _ = ctx;

        var blockStart = new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);
        var blockEnd = blockStart.AddHours(2);

        ctx.Appointments.AddRange(
            new Appointment
            {
                TenantId = tenantId, ClientId = Guid.NewGuid(),
                ProfessionalId = Guid.NewGuid(), ServiceId = Guid.NewGuid(),
                StartAtUtc = blockStart.AddMinutes(30), EndAtUtc = blockStart.AddHours(1),
                Status = AppointmentStatus.Cancelled,
                RequiresReview = false, CreatedByCollaboratorId = adminId
            },
            new Appointment
            {
                TenantId = tenantId, ClientId = Guid.NewGuid(),
                ProfessionalId = Guid.NewGuid(), ServiceId = Guid.NewGuid(),
                StartAtUtc = blockStart.AddMinutes(30), EndAtUtc = blockStart.AddHours(1),
                Status = AppointmentStatus.Completed,
                RequiresReview = false, CreatedByCollaboratorId = adminId
            });
        await ctx.SaveChangesAsync();

        var repo = new SalonBlockRepository(ctx);
        var service = new SalonBlockService(new FakeTenantContext(tenantId), repo);

        await service.CreateAsync(blockStart, blockEnd, "Reforma", adminId);

        Assert.All(await ctx.Appointments.ToListAsync(), a => Assert.False(a.RequiresReview));
    }

    [Fact]
    public async Task CreateBlock_WithNoOverlappingAppointments_ShouldSucceedSilently()
    {
        var (ctx, tenantId, adminId) = CreateContext();
        await using var _ = ctx;

        var repo = new SalonBlockRepository(ctx);
        var service = new SalonBlockService(new FakeTenantContext(tenantId), repo);

        var block = await service.CreateAsync(
            new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2024, 6, 10, 16, 0, 0, TimeSpan.Zero),
            "Sem agendamentos", adminId);

        Assert.NotEqual(Guid.Empty, block.Id);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
