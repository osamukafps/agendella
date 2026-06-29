using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Infrastructure;

public sealed class AppointmentConcurrencyTests
{
    private static AgendellaDbContext CreateContext(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AgendellaDbContext(options, new FakeTenantContext(tenantId));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowConflict_WhenOverlappingAppointmentExists()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var start = new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);
        var end = start.AddHours(1);

        await using var ctx = CreateContext(tenantId);
        var repo = new AppointmentRepository(ctx);

        var first = new Appointment
        {
            TenantId = tenantId,
            ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId,
            ServiceId = Guid.NewGuid(),
            StartAtUtc = start,
            EndAtUtc = end,
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        await repo.CreateAsync(first, null);
        await repo.SaveChangesAsync();

        var overlapping = new Appointment
        {
            TenantId = tenantId,
            ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId,
            ServiceId = Guid.NewGuid(),
            StartAtUtc = start.AddMinutes(30),
            EndAtUtc = end.AddMinutes(30),
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        var existingConflict = new AppointmentConflictError(
            AvailabilityConflictType.ExistingAppointment,
            start, end, first.Id, null);

        var exception = await Assert.ThrowsAsync<Agendella.Application.Common.Errors.ApplicationRuleException>(async () =>
            await repo.CreateAsync(overlapping, existingConflict));

        Assert.Equal("appointment.conflict", exception.Error.Code);
        Assert.Equal(409, exception.Error.StatusCode);
    }

    [Fact]
    public async Task CreateAsync_ShouldSucceed_WhenNoConflictDetected()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var start = new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);
        var end = start.AddHours(1);

        await using var ctx = CreateContext(tenantId);
        var repo = new AppointmentRepository(ctx);

        var appointment = new Appointment
        {
            TenantId = tenantId,
            ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId,
            ServiceId = Guid.NewGuid(),
            StartAtUtc = start,
            EndAtUtc = end,
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        await repo.CreateAsync(appointment, null);
        await repo.SaveChangesAsync();

        var saved = await repo.FindByIdAsync(appointment.Id);
        Assert.NotNull(saved);
        Assert.Equal(start, saved.StartAtUtc);
    }

    [Fact]
    public async Task ConsecutiveAppointments_ShouldNotConflict()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var firstStart = new DateTimeOffset(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);
        var firstEnd = firstStart.AddHours(1);

        await using var ctx = CreateContext(tenantId);
        var repo = new AppointmentRepository(ctx);

        var first = new Appointment
        {
            TenantId = tenantId,
            ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId,
            ServiceId = Guid.NewGuid(),
            StartAtUtc = firstStart,
            EndAtUtc = firstEnd,
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        await repo.CreateAsync(first, null);
        await repo.SaveChangesAsync();

        var scheduled = await repo.GetScheduledAppointmentsInWindowAsync(
            professionalId, firstEnd, firstEnd.AddHours(1), null);

        Assert.Empty(scheduled);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : Agendella.Application.Tenancy.ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
