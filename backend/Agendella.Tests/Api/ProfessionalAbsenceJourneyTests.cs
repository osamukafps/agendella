using Agendella.Application.Common.Errors;
using Agendella.Application.Scheduling;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using ServiceEntity = Agendella.Domain.Entities.Service;

namespace Agendella.Tests.Api;

public sealed class ProfessionalAbsenceJourneyTests
{
    private const string SalonTz = "America/Sao_Paulo";

    private static (AgendellaDbContext ctx, Guid tenantId, Guid professionalId,
        ServiceEntity svc, Client client, SalonCollaborator admin)
        BuildContext()
    {
        var tenantId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
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
            Id = professionalId, TenantId = tenantId,
            Name = "Ana", Phone = "11888", Email = "ana@s.com", Status = RecordStatus.Active
        };
        var svc = new ServiceEntity
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Corte", DurationMinutes = 60, PriceAmount = 50, Currency = "BRL",
            Status = RecordStatus.Active
        };
        var client = new Client
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Maria", Phone = "11777", Status = RecordStatus.Active
        };
        var admin = new SalonCollaborator
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Email = "admin@s.com", Role = CollaboratorRole.Administradora,
            Status = RecordStatus.Active
        };

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(salon);
        seed.Professionals.Add(professional);
        seed.Services.Add(svc);
        seed.Clients.Add(client);
        seed.SalonCollaborators.Add(admin);
        seed.SalonBusinessHours.Add(new SalonBusinessHour
        {
            TenantId = tenantId, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0), IsClosed = false
        });
        seed.ProfessionalWeeklyAvailabilities.Add(new ProfessionalWeeklyAvailability
        {
            TenantId = tenantId, ProfessionalId = professionalId, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0)
        });
        seed.SaveChanges();

        return (new AgendellaDbContext(options, new FakeTenantContext(tenantId)), tenantId, professionalId, svc, client, admin);
    }

    [Fact]
    public async Task CreateAbsence_ShouldPreserveExistingAppointments_AndMarkThemForReview()
    {
        var (ctx, tenantId, professionalId, svc, client, admin) = BuildContext();
        await using var _ = ctx;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var apptStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));

        var apptRepo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var schedulingService = new AppointmentSchedulingService(tenantCtx, apptRepo, apptRepo);
        var appointment = await schedulingService.CreateAsync(
            client.Id, professionalId, svc.Id, apptStart, null, admin.Id);

        Assert.False(appointment.RequiresReview);

        var absenceRepo = new ProfessionalAbsenceRepository(ctx);
        var absenceService = new ProfessionalAbsenceService(tenantCtx, absenceRepo);

        var absenceStart = apptStart.AddMinutes(-30);
        var absenceEnd = apptStart.AddHours(2);
        await absenceService.CreateAsync(professionalId, absenceStart, absenceEnd, "Consulta", admin.Id, null);

        var updatedAppt = await ctx.Appointments.FindAsync(appointment.Id);
        Assert.Equal(AppointmentStatus.Scheduled, updatedAppt!.Status);
        Assert.True(updatedAppt.RequiresReview);
        Assert.Contains("Consulta", updatedAppt.ReviewReason);
    }

    [Fact]
    public async Task ActiveAbsence_ShouldBlockNewAppointments_InAbsenceWindow()
    {
        var (ctx, tenantId, professionalId, svc, client, admin) = BuildContext();
        await using var _ = ctx;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var absenceStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 14, 0, 0), tz));
        var absenceEnd = absenceStart.AddHours(3);

        var absenceRepo = new ProfessionalAbsenceRepository(ctx);
        var absenceService = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), absenceRepo);
        await absenceService.CreateAsync(professionalId, absenceStart, absenceEnd, "Ferias", admin.Id, null);

        var apptRepo = new AppointmentRepository(ctx);
        var schedulingService = new AppointmentSchedulingService(
            new FakeTenantContext(tenantId), apptRepo, apptRepo);

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await schedulingService.CreateAsync(
                client.Id, professionalId, svc.Id,
                absenceStart.AddMinutes(30), null, admin.Id));

        Assert.Equal(ErrorCodes.AppointmentConflict, ex.Error.Code);
    }

    [Fact]
    public async Task CancelledAbsence_ShouldAllowNewAppointments_InFormerAbsenceWindow()
    {
        var (ctx, tenantId, professionalId, svc, client, admin) = BuildContext();
        await using var _ = ctx;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var absenceStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 14, 0, 0), tz));
        var absenceEnd = absenceStart.AddHours(3);

        var absenceRepo = new ProfessionalAbsenceRepository(ctx);
        var absenceService = new ProfessionalAbsenceService(new FakeTenantContext(tenantId), absenceRepo);
        var absence = await absenceService.CreateAsync(
            professionalId, absenceStart, absenceEnd, "Consulta", admin.Id, null);

        await absenceService.CancelAsync(professionalId, absence.Id, null);

        var apptRepo = new AppointmentRepository(ctx);
        var schedulingService = new AppointmentSchedulingService(
            new FakeTenantContext(tenantId), apptRepo, apptRepo);

        var appointment = await schedulingService.CreateAsync(
            client.Id, professionalId, svc.Id,
            absenceStart.AddMinutes(30), null, admin.Id);

        Assert.NotEqual(Guid.Empty, appointment.Id);
        Assert.Equal(AppointmentStatus.Scheduled, appointment.Status);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
