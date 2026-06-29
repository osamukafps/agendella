using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;

namespace Agendella.Tests.Domain;

public sealed class AvailabilityPrecedenceTests
{
    private const string TimeZone = "America/Sao_Paulo";

    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid ProfessionalId = Guid.NewGuid();

    private static SalonBusinessHour OpenHour(DayOfWeek day) => new()
    {
        TenantId = TenantId,
        DayOfWeek = day,
        StartLocalTime = new TimeOnly(8, 0),
        EndLocalTime = new TimeOnly(18, 0),
        IsClosed = false
    };

    private static ProfessionalWeeklyAvailability FullDayAvailability(DayOfWeek day) => new()
    {
        TenantId = TenantId,
        ProfessionalId = ProfessionalId,
        DayOfWeek = day,
        StartLocalTime = new TimeOnly(8, 0),
        EndLocalTime = new TimeOnly(18, 0)
    };

    [Fact]
    public void Evaluate_ShouldBlock_WhenOutsideBusinessHours()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday8am = new DateTime(2024, 6, 10, 7, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday8am, tz);
        var end = start.AddHours(1);

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [], [], []);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.OutsideBusinessHours, conflict.Type);
    }

    [Fact]
    public void Evaluate_ShouldBlock_WhenOutsideProfessionalAvailability()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday9am = new DateTime(2024, 6, 10, 9, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday9am, tz);
        var end = start.AddHours(1);

        var limitedAvailability = new ProfessionalWeeklyAvailability
        {
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(14, 0),
            EndLocalTime = new TimeOnly(18, 0)
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [limitedAvailability],
            [], [], []);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.OutsideProfessionalAvailability, conflict.Type);
    }

    [Fact]
    public void Evaluate_ShouldBlock_WhenOverlapsSalonBlock()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday10am = new DateTime(2024, 6, 10, 10, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday10am, tz);
        var end = start.AddHours(1);

        var block = new SalonBlock
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            StartAtUtc = start.AddMinutes(30),
            EndAtUtc = start.AddHours(2),
            Reason = "Manutencao"
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [block], [], []);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.SalonBlock, conflict.Type);
        Assert.Equal(block.Id, conflict.ResourceId);
    }

    [Fact]
    public void Evaluate_ShouldBlock_WhenOverlapsProfessionalAbsence()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday11am = new DateTime(2024, 6, 10, 11, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday11am, tz);
        var end = start.AddHours(1);

        var absence = new ProfessionalAbsence
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            StartAtUtc = start,
            EndAtUtc = end.AddHours(1),
            Status = RecordStatus.Active,
            Reason = "Consulta"
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [], [absence], []);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.ProfessionalAbsence, conflict.Type);
    }

    [Fact]
    public void Evaluate_ShouldBlock_WhenOverlapsExistingAppointment()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday14pm = new DateTime(2024, 6, 10, 14, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday14pm, tz);
        var end = start.AddHours(1);

        var existing = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            ClientId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            StartAtUtc = start.AddMinutes(30),
            EndAtUtc = start.AddHours(2),
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [], [], [existing]);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.ExistingAppointment, conflict.Type);
    }

    [Fact]
    public void Evaluate_ShouldAllowConsecutiveAppointments()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday14pm = new DateTime(2024, 6, 10, 14, 0, 0);
        var existingStart = TimeZoneInfo.ConvertTimeToUtc(localMonday14pm, tz);
        var existingEnd = existingStart.AddHours(1);
        var newStart = existingEnd;
        var newEnd = newStart.AddHours(1);

        var existing = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            ClientId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            StartAtUtc = existingStart,
            EndAtUtc = existingEnd,
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = Guid.NewGuid()
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            newStart, newEnd, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [], [], [existing]);

        Assert.Null(conflict);
    }

    [Fact]
    public void Evaluate_ShouldReturnNull_WhenAllChecksPassed()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        var localMonday10am = new DateTime(2024, 6, 10, 10, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday10am, tz);
        var end = start.AddHours(1);

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, TimeZone,
            [OpenHour(DayOfWeek.Monday)],
            [FullDayAvailability(DayOfWeek.Monday)],
            [], [], []);

        Assert.Null(conflict);
    }
}
