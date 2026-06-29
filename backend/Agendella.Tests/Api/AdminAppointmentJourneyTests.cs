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

public sealed class AdminAppointmentJourneyTests
{
    private const string SalonTz = "America/Sao_Paulo";

    private static (AgendellaDbContext ctx, SalonTenant salon, Professional professional,
        ServiceEntity service, Client client, SalonCollaborator admin)
        BuildTestContext(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var salon = new SalonTenant
        {
            Id = tenantId,
            Name = "Salao Teste",
            Address = "Rua A",
            Phone = "11999",
            TimeZoneId = SalonTz,
            Status = SalonStatus.Active,
            MinimumCancellationNoticeMinutes = 60
        };

        var professional = new Professional
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
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

        var businessHour = new SalonBusinessHour
        {
            TenantId = tenantId, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0), IsClosed = false
        };

        var profAvail = new ProfessionalWeeklyAvailability
        {
            TenantId = tenantId, ProfessionalId = professional.Id, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0)
        };

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(salon);
        seed.Professionals.Add(professional);
        seed.Services.Add(svc);
        seed.Clients.Add(client);
        seed.SalonCollaborators.Add(admin);
        seed.SalonBusinessHours.Add(businessHour);
        seed.ProfessionalWeeklyAvailabilities.Add(profAvail);
        seed.SaveChanges();

        var ctx = new AgendellaDbContext(options, new FakeTenantContext(tenantId));
        return (ctx, salon, professional, svc, client, admin);
    }

    [Fact]
    public async Task Admin_ShouldCreateRescheduleAndCancelAppointment()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional, svc, client, admin) = BuildTestContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var schedulingService = new AppointmentSchedulingService(tenantCtx, repo, repo);
        var cancellationService = new AppointmentCancellationService(tenantCtx, repo, repo);

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var localMonday10am = new DateTime(2024, 6, 10, 10, 0, 0);
        var startUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localMonday10am, tz));

        var appointment = await schedulingService.CreateAsync(
            client.Id, professional.Id, svc.Id, startUtc, null, admin.Id);

        Assert.NotEqual(Guid.Empty, appointment.Id);
        Assert.Equal(AppointmentStatus.Scheduled, appointment.Status);
        Assert.Equal(startUtc.AddHours(1), appointment.EndAtUtc);

        var newStart = startUtc.AddHours(3);
        var rescheduled = await schedulingService.RescheduleAsync(
            appointment.Id, newStart, null, admin.Id, null);

        Assert.Equal(newStart, rescheduled.StartAtUtc);
        Assert.Equal(AppointmentStatus.Scheduled, rescheduled.Status);

        await cancellationService.CancelAsync(appointment.Id, admin.Id, null, isAdmin: true);

        var cancelled = await repo.FindByIdAsync(appointment.Id);
        Assert.Equal(AppointmentStatus.Cancelled, cancelled!.Status);
    }

    [Fact]
    public async Task Admin_ShouldCompleteAppointment_AndNoShow()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional, svc, client, admin) = BuildTestContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var schedulingService = new AppointmentSchedulingService(tenantCtx, repo, repo);
        var outcomeService = new AppointmentOutcomeService(tenantCtx, repo);

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));

        var appt1 = await schedulingService.CreateAsync(client.Id, professional.Id, svc.Id, start, null, admin.Id);
        await outcomeService.CompleteAsync(appt1.Id, admin.Id, null);
        var completed = await repo.FindByIdAsync(appt1.Id);
        Assert.Equal(AppointmentStatus.Completed, completed!.Status);

        var start2 = start.AddHours(2);
        var appt2 = await schedulingService.CreateAsync(client.Id, professional.Id, svc.Id, start2, null, admin.Id);
        await outcomeService.MarkNoShowAsync(appt2.Id, admin.Id, null);
        var noShow = await repo.FindByIdAsync(appt2.Id);
        Assert.Equal(AppointmentStatus.NoShow, noShow!.Status);
    }

    [Fact]
    public async Task Admin_ShouldResolveReviewFlag()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional, svc, client, admin) = BuildTestContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var reviewService = new AppointmentReviewService(tenantCtx, repo);

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));

        var appointment = new Appointment
        {
            TenantId = tenantId, ClientId = client.Id, ProfessionalId = professional.Id,
            ServiceId = svc.Id, StartAtUtc = start, EndAtUtc = start.AddHours(1),
            Status = AppointmentStatus.Scheduled,
            RequiresReview = true, ReviewReason = "Bloco criado sobre o agendamento.",
            CreatedByCollaboratorId = admin.Id
        };

        await repo.CreateAsync(appointment, null);
        await repo.SaveChangesAsync();

        await reviewService.ResolveReviewAsync(appointment.Id, admin.Id);

        var resolved = await repo.FindByIdAsync(appointment.Id);
        Assert.False(resolved!.RequiresReview);
        Assert.Null(resolved.ReviewReason);
    }

    [Fact]
    public async Task Create_ShouldThrowConflict_WhenOverlappingAppointmentExists()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, _, professional, svc, client, admin) = BuildTestContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var schedulingService = new AppointmentSchedulingService(tenantCtx, repo, repo);

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));

        await schedulingService.CreateAsync(client.Id, professional.Id, svc.Id, start, null, admin.Id);

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await schedulingService.CreateAsync(client.Id, professional.Id, svc.Id, start.AddMinutes(30), null, admin.Id));

        Assert.Equal(ErrorCodes.AppointmentConflict, ex.Error.Code);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
