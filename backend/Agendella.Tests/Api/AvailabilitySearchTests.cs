using Agendella.Application.Scheduling;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Api;

public sealed class AvailabilitySearchTests
{
    private const string SalonTz = "America/Sao_Paulo";

    private static (AgendellaDbContext ctx, SalonTenant salon, Professional professional)
        BuildContext(Guid tenantId, bool withAvailability = true)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var salon = new SalonTenant
        {
            Id = tenantId, Name = "S", Address = "A", Phone = "1",
            TimeZoneId = SalonTz, Status = SalonStatus.Active,
            MinimumCancellationNoticeMinutes = 0
        };

        var professional = new Professional
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Ana", Phone = "11888", Email = "ana@s.com", Status = RecordStatus.Active
        };

        var bh = new SalonBusinessHour
        {
            TenantId = tenantId, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0), IsClosed = false
        };

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(salon);
        seed.Professionals.Add(professional);
        seed.SalonBusinessHours.Add(bh);

        if (withAvailability)
        {
            seed.ProfessionalWeeklyAvailabilities.Add(new ProfessionalWeeklyAvailability
            {
                TenantId = tenantId, ProfessionalId = professional.Id, DayOfWeek = DayOfWeek.Monday,
                StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0)
            });
        }

        seed.SaveChanges();

        var ctx = new AgendellaDbContext(options, new FakeTenantContext(tenantId));
        return (ctx, salon, professional);
    }

    [Fact]
    public async Task SearchAsync_ShouldReturnSlots_WhenFullDayIsOpen()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional) = BuildContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var service = new AvailabilityService(new FakeTenantContext(tenantId), repo);

        var monday = new DateOnly(2024, 6, 10);
        var slots = await service.SearchAsync(professional.Id, monday, 60);

        Assert.NotEmpty(slots);
        Assert.All(slots, slot => Assert.True(slot.EndAtUtc > slot.StartAtUtc));
    }

    [Fact]
    public async Task SearchAsync_ShouldReturnEmpty_WhenProfessionalHasNoAvailability()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional) = BuildContext(tenantId, withAvailability: false);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var service = new AvailabilityService(new FakeTenantContext(tenantId), repo);

        var monday = new DateOnly(2024, 6, 10);
        var slots = await service.SearchAsync(professional.Id, monday, 60);

        Assert.Empty(slots);
    }

    [Fact]
    public async Task SearchAsync_ShouldReturnEmpty_WhenEntireDayIsBlocked()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional) = BuildContext(tenantId);
        await using var _ = ctx;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var monday8am = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 8, 0, 0), tz));
        var monday6pm = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 18, 0, 0), tz));

        ctx.SalonBlocks.Add(new SalonBlock
        {
            TenantId = tenantId,
            StartAtUtc = monday8am,
            EndAtUtc = monday6pm,
            Reason = "Fechado para reforma",
            CreatedByCollaboratorId = Guid.NewGuid()
        });
        await ctx.SaveChangesAsync();

        var repo = new AppointmentRepository(ctx);
        var service = new AvailabilityService(new FakeTenantContext(tenantId), repo);

        var monday = new DateOnly(2024, 6, 10);
        var slots = await service.SearchAsync(professional.Id, monday, 60);

        Assert.Empty(slots);
    }

    [Fact]
    public async Task SearchAsync_SlotDuration_ShouldMatchRequestedDuration()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional) = BuildContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var service = new AvailabilityService(new FakeTenantContext(tenantId), repo);

        var monday = new DateOnly(2024, 6, 10);
        var slots = await service.SearchAsync(professional.Id, monday, 45);

        Assert.NotEmpty(slots);
        Assert.All(slots, slot =>
            Assert.Equal(45, (int)(slot.EndAtUtc - slot.StartAtUtc).TotalMinutes));
    }

    [Fact]
    public async Task SearchAsync_ShouldNotReturnSlotsOverlappingExistingAppointments()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional) = BuildContext(tenantId);
        await using var _ = ctx;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var apptStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));
        var apptEnd = apptStart.AddHours(1);

        ctx.Appointments.Add(new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = professional.Id, ServiceId = Guid.NewGuid(),
            StartAtUtc = apptStart, EndAtUtc = apptEnd,
            Status = AppointmentStatus.Scheduled, CreatedByCollaboratorId = Guid.NewGuid()
        });
        await ctx.SaveChangesAsync();

        var repo = new AppointmentRepository(ctx);
        var service = new AvailabilityService(new FakeTenantContext(tenantId), repo);

        var monday = new DateOnly(2024, 6, 10);
        var slots = await service.SearchAsync(professional.Id, monday, 60);

        Assert.DoesNotContain(slots, slot =>
            AppointmentWindow.Overlaps(slot.StartAtUtc, slot.EndAtUtc, apptStart, apptEnd));
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
