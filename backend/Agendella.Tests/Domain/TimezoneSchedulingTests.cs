using Agendella.Domain.Entities;
using Agendella.Domain.Scheduling;

namespace Agendella.Tests.Domain;

public sealed class TimezoneSchedulingTests
{
    private const string SaoPauloTz = "America/Sao_Paulo";
    private const string NewYorkTz = "America/New_York";

    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid ProfessionalId = Guid.NewGuid();

    [Fact]
    public void Evaluate_ShouldRejectAppointment_WhenLocalTimeIsBeforeBusinessHours_InSaoPaulo()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(SaoPauloTz);
        var localSunday7am = new DateTime(2024, 6, 16, 7, 30, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localSunday7am, tz);
        var end = start.AddHours(1);

        var businessHour = new SalonBusinessHour
        {
            TenantId = TenantId,
            DayOfWeek = DayOfWeek.Sunday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(16, 0),
            IsClosed = false
        };

        var availability = new ProfessionalWeeklyAvailability
        {
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            DayOfWeek = DayOfWeek.Sunday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(16, 0)
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, SaoPauloTz,
            [businessHour], [availability], [], [], []);

        Assert.NotNull(conflict);
        Assert.Equal(AvailabilityConflictType.OutsideBusinessHours, conflict.Type);
    }

    [Fact]
    public void Evaluate_ShouldAllowAppointment_WhenLocalTimeIsInsideBusinessHours_InSaoPaulo()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(SaoPauloTz);
        var localMonday9am = new DateTime(2024, 6, 10, 9, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localMonday9am, tz);
        var end = start.AddHours(1);

        var businessHour = new SalonBusinessHour
        {
            TenantId = TenantId,
            DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(18, 0),
            IsClosed = false
        };

        var availability = new ProfessionalWeeklyAvailability
        {
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(18, 0)
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, SaoPauloTz,
            [businessHour], [availability], [], [], []);

        Assert.Null(conflict);
    }

    [Fact]
    public void Evaluate_ShouldUseCorrectLocalDay_WhenUTCCrossesDateBoundary()
    {
        // UTC midnight in SP is still the previous local day (UTC-3)
        var tz = TimeZoneInfo.FindSystemTimeZoneById(SaoPauloTz);
        var utcMidnight = new DateTimeOffset(2024, 6, 11, 0, 30, 0, TimeSpan.Zero);
        var end = utcMidnight.AddHours(1);

        // Local time is 21:30 Monday, but salon is open Mon 8-22
        var businessHour = new SalonBusinessHour
        {
            TenantId = TenantId,
            DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(22, 0),
            IsClosed = false
        };

        var availability = new ProfessionalWeeklyAvailability
        {
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            DayOfWeek = DayOfWeek.Monday,
            StartLocalTime = new TimeOnly(8, 0),
            EndLocalTime = new TimeOnly(22, 0)
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            utcMidnight, end, SaoPauloTz,
            [businessHour], [availability], [], [], []);

        Assert.Null(conflict);
    }

    [Fact]
    public void Evaluate_ShouldUseIanaTimezone_ForDSTAwareDayResolution()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(NewYorkTz);
        var localWednesday10am = new DateTime(2024, 3, 13, 10, 0, 0);
        var start = TimeZoneInfo.ConvertTimeToUtc(localWednesday10am, tz);
        var end = start.AddHours(1);

        var businessHour = new SalonBusinessHour
        {
            TenantId = TenantId,
            DayOfWeek = DayOfWeek.Wednesday,
            StartLocalTime = new TimeOnly(9, 0),
            EndLocalTime = new TimeOnly(17, 0),
            IsClosed = false
        };

        var availability = new ProfessionalWeeklyAvailability
        {
            TenantId = TenantId,
            ProfessionalId = ProfessionalId,
            DayOfWeek = DayOfWeek.Wednesday,
            StartLocalTime = new TimeOnly(9, 0),
            EndLocalTime = new TimeOnly(17, 0)
        };

        var conflict = AvailabilityEvaluator.Evaluate(
            start, end, NewYorkTz,
            [businessHour], [availability], [], [], []);

        Assert.Null(conflict);
    }
}
