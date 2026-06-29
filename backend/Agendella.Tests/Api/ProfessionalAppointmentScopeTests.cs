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

public sealed class ProfessionalAppointmentScopeTests
{
    private const string SalonTz = "America/Sao_Paulo";

    private static (AgendellaDbContext ctx, Professional profA, Professional profB,
        ServiceEntity svc, Client client, SalonCollaborator admin)
        BuildContext(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var salon = new SalonTenant
        {
            Id = tenantId, Name = "S", Address = "A", Phone = "1",
            TimeZoneId = SalonTz, Status = SalonStatus.Active,
            MinimumCancellationNoticeMinutes = 120
        };

        var profA = new Professional
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Ana", Phone = "11888", Email = "ana@s.com", Status = RecordStatus.Active
        };

        var profB = new Professional
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Beth", Phone = "11777", Email = "beth@s.com", Status = RecordStatus.Active
        };

        var svc = new ServiceEntity
        {
            Id = Guid.NewGuid(), TenantId = tenantId, Name = "Corte",
            DurationMinutes = 60, PriceAmount = 50, Currency = "BRL", Status = RecordStatus.Active
        };

        var client = new Client
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Name = "Maria", Phone = "11666", Status = RecordStatus.Active
        };

        var admin = new SalonCollaborator
        {
            Id = Guid.NewGuid(), TenantId = tenantId, Email = "admin@s.com",
            Role = CollaboratorRole.Administradora, Status = RecordStatus.Active
        };

        var bh = new SalonBusinessHour
        {
            TenantId = tenantId, DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0), EndLocalTime = new TimeOnly(18, 0), IsClosed = false
        };

        foreach (var prof in new[] { profA, profB })
        {
            // no weekly availability configured — will fail availability check
        }

        using var seed = new AgendellaDbContext(options);
        seed.SalonTenants.Add(salon);
        seed.Professionals.AddRange(profA, profB);
        seed.Services.Add(svc);
        seed.Clients.Add(client);
        seed.SalonCollaborators.Add(admin);
        seed.SalonBusinessHours.Add(bh);
        seed.SaveChanges();

        var ctx = new AgendellaDbContext(options, new FakeTenantContext(tenantId));
        return (ctx, profA, profB, svc, client, admin);
    }

    [Fact]
    public async Task Profissional_ShouldNotBeAbleToRescheduleAnothersProfessionalsAppointment()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, profA, profB, svc, client, admin) = BuildContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var schedulingService = new AppointmentSchedulingService(tenantCtx, repo, repo);

        var tz = TimeZoneInfo.FindSystemTimeZoneById(SalonTz);
        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(2024, 6, 10, 10, 0, 0), tz));

        var appointment = new Appointment
        {
            TenantId = tenantId, ClientId = client.Id, ProfessionalId = profA.Id,
            ServiceId = svc.Id, StartAtUtc = start, EndAtUtc = start.AddHours(1),
            Status = AppointmentStatus.Scheduled, CreatedByCollaboratorId = admin.Id
        };

        await repo.CreateAsync(appointment, null);
        await repo.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await schedulingService.RescheduleAsync(
                appointment.Id, start.AddHours(3), null, profB.Id, profB.Id));

        Assert.Equal(ErrorCodes.Forbidden, ex.Error.Code);
    }

    [Fact]
    public async Task Profissional_ShouldNotBeAbleToCancelAfterWindow()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, profA, _, svc, client, admin) = BuildContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var cancellationService = new AppointmentCancellationService(tenantCtx, repo, repo);

        var start = DateTimeOffset.UtcNow.AddMinutes(30);

        var appointment = new Appointment
        {
            TenantId = tenantId, ClientId = client.Id, ProfessionalId = profA.Id,
            ServiceId = svc.Id, StartAtUtc = start, EndAtUtc = start.AddHours(1),
            Status = AppointmentStatus.Scheduled, CreatedByCollaboratorId = admin.Id
        };

        await repo.CreateAsync(appointment, null);
        await repo.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await cancellationService.CancelAsync(appointment.Id, profA.Id, profA.Id, isAdmin: false));

        Assert.Equal(ErrorCodes.CancellationWindowExpired, ex.Error.Code);
    }

    [Fact]
    public async Task Admin_ShouldBeAbleToCancelAfterWindow()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, profA, _, svc, client, admin) = BuildContext(tenantId);
        await using var _ = ctx;

        var repo = new AppointmentRepository(ctx);
        var tenantCtx = new FakeTenantContext(tenantId);
        var cancellationService = new AppointmentCancellationService(tenantCtx, repo, repo);

        var start = DateTimeOffset.UtcNow.AddMinutes(30);

        var appointment = new Appointment
        {
            TenantId = tenantId, ClientId = client.Id, ProfessionalId = profA.Id,
            ServiceId = svc.Id, StartAtUtc = start, EndAtUtc = start.AddHours(1),
            Status = AppointmentStatus.Scheduled, CreatedByCollaboratorId = admin.Id
        };

        await repo.CreateAsync(appointment, null);
        await repo.SaveChangesAsync();

        await cancellationService.CancelAsync(appointment.Id, admin.Id, null, isAdmin: true);

        var cancelled = await repo.FindByIdAsync(appointment.Id);
        Assert.Equal(AppointmentStatus.Cancelled, cancelled!.Status);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }
}
