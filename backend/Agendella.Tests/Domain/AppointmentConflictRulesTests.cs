using Agendella.Domain.Scheduling;

namespace Agendella.Tests.Domain;

public sealed class AppointmentConflictRulesTests
{
    private static readonly DateTimeOffset Base = new(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Overlaps_ShouldReturnTrue_WhenIntervalsFullyOverlap()
    {
        var a_start = Base;
        var a_end = Base.AddHours(2);
        var b_start = Base.AddHours(1);
        var b_end = Base.AddHours(3);

        Assert.True(AppointmentWindow.Overlaps(a_start, a_end, b_start, b_end));
    }

    [Fact]
    public void Overlaps_ShouldReturnFalse_WhenIntervalsAreConsecutive()
    {
        var first_start = Base;
        var first_end = Base.AddHours(1);
        var second_start = Base.AddHours(1);
        var second_end = Base.AddHours(2);

        Assert.False(AppointmentWindow.Overlaps(first_start, first_end, second_start, second_end));
    }

    [Fact]
    public void Overlaps_ShouldReturnFalse_WhenIntervalsAreDisjoint()
    {
        var a_start = Base;
        var a_end = Base.AddHours(1);
        var b_start = Base.AddHours(2);
        var b_end = Base.AddHours(3);

        Assert.False(AppointmentWindow.Overlaps(a_start, a_end, b_start, b_end));
    }

    [Fact]
    public void Overlaps_ShouldReturnTrue_WhenOneContainsAnother()
    {
        var outer_start = Base;
        var outer_end = Base.AddHours(3);
        var inner_start = Base.AddMinutes(30);
        var inner_end = Base.AddHours(2);

        Assert.True(AppointmentWindow.Overlaps(outer_start, outer_end, inner_start, inner_end));
    }

    [Fact]
    public void Overlaps_ShouldReturnFalse_WhenConsecutiveReversed()
    {
        var second_start = Base.AddHours(1);
        var second_end = Base.AddHours(2);
        var first_start = Base;
        var first_end = Base.AddHours(1);

        Assert.False(AppointmentWindow.Overlaps(second_start, second_end, first_start, first_end));
    }

    [Fact]
    public void Overlaps_ShouldReturnTrue_WhenStartsMatch()
    {
        var a_start = Base;
        var a_end = Base.AddHours(1);
        var b_start = Base;
        var b_end = Base.AddMinutes(30);

        Assert.True(AppointmentWindow.Overlaps(a_start, a_end, b_start, b_end));
    }
}
