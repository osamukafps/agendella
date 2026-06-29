using Agendella.Application.Scheduling;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Tests.Application;

public sealed class ProfessionalAbsenceReviewTests
{
    private static AgendellaDbContext CreateContext(Guid tenantId, Guid professionalId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(new SalonTenant
        {
            Id = tenantId, Name = "S", Address = "A", Phone = "1",
            TimeZoneId = "America/Sao_Paulo", Status = SalonStatus.Active
        });
        seed.Professionals.Add(new Professional
        {
            Id = professionalId, TenantId = tenantId,
            Name = "Ana", Phone = "11888", Email = "ana@s.com", Status = RecordStatus.Active
        });
        seed.SaveChanges();

        return new AgendellaDbContext(options, new FakeTenantContext(tenantId));
    }

    [Fact]
    public async Task CreateAbsence_ShouldMarkOverlappingScheduledAppointments_WithRequiresReview()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        await using var ctx = CreateContext(tenantId, professionalId);

        var absenceStart = new DateTimeOffset(2024, 6, 10, 10, 0, 0, TimeSpan.Zero);
        var absenceEnd = absenceStart.AddHours(4);

        var overlappingAppt = new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId, ServiceId = Guid.NewGuid(),
            StartAtUtc = absenceStart.AddHours(1), EndAtUtc = absenceStart.AddHours(2),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = false, CreatedByCollaboratorId = adminId
        };

        var otherProfAppt = new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = Guid.NewGuid(), ServiceId = Guid.NewGuid(),
            StartAtUtc = absenceStart.AddHours(1), EndAtUtc = absenceStart.AddHours(2),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = false, CreatedByCollaboratorId = adminId
        };

        ctx.Appointments.AddRange(overlappingAppt, otherProfAppt);
        await ctx.SaveChangesAsync();

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        await service.CreateAsync(professionalId, absenceStart, absenceEnd, "Consulta medica", adminId, null);

        var markedAppt = await ctx.Appointments.FindAsync(overlappingAppt.Id);
        var otherAppt = await ctx.Appointments.FindAsync(otherProfAppt.Id);

        Assert.True(markedAppt!.RequiresReview);
        Assert.Contains("Consulta medica", markedAppt.ReviewReason);
        Assert.False(otherAppt!.RequiresReview);
    }

    [Fact]
    public async Task CancelAbsence_ShouldSetStatusToInactive_ButPreserveReviewFlags()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        await using var ctx = CreateContext(tenantId, professionalId);

        var absenceStart = new DateTimeOffset(2024, 6, 10, 10, 0, 0, TimeSpan.Zero);
        var absenceEnd = absenceStart.AddHours(4);

        var appointment = new Appointment
        {
            TenantId = tenantId, ClientId = Guid.NewGuid(),
            ProfessionalId = professionalId, ServiceId = Guid.NewGuid(),
            StartAtUtc = absenceStart.AddHours(1), EndAtUtc = absenceStart.AddHours(2),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = false, CreatedByCollaboratorId = adminId
        };
        ctx.Appointments.Add(appointment);
        await ctx.SaveChangesAsync();

        var repo = new ProfessionalAbsenceRepository(ctx);
        var service = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), repo);

        var absence = await service.CreateAsync(professionalId, absenceStart, absenceEnd, "Ferias", adminId, null);
        await service.CancelAsync(professionalId, absence.Id, null);

        var updated = await ctx.Appointments.FindAsync(appointment.Id);
        var cancelledAbsence = await ctx.ProfessionalAbsences.FindAsync(absence.Id);

        Assert.Equal(RecordStatus.Inactive, cancelledAbsence!.Status);
        Assert.NotNull(cancelledAbsence.CancelledAtUtc);
        Assert.True(updated!.RequiresReview);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
