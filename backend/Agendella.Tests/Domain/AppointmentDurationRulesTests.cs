using Agendella.Domain.Scheduling;

namespace Agendella.Tests.Domain;

public sealed class AppointmentDurationRulesTests
{
    private static readonly DateTimeOffset Start = new(2024, 6, 10, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ComputeEnd_ShouldUseServiceDuration_WhenNoManualEnd()
    {
        var end = AppointmentWindow.ComputeEnd(Start, 60, null);

        Assert.Equal(Start.AddHours(1), end);
    }

    [Fact]
    public void ComputeEnd_ShouldUseManualEnd_WhenProvidedAndAfterStart()
    {
        var manualEnd = Start.AddMinutes(90);
        var end = AppointmentWindow.ComputeEnd(Start, 60, manualEnd);

        Assert.Equal(manualEnd, end);
    }

    [Fact]
    public void ComputeEnd_ShouldFallBackToServiceDuration_WhenManualEndIsBeforeStart()
    {
        var badManualEnd = Start.AddMinutes(-30);
        var end = AppointmentWindow.ComputeEnd(Start, 60, badManualEnd);

        Assert.Equal(Start.AddHours(1), end);
    }

    [Fact]
    public void ComputeEnd_ShouldFallBackToServiceDuration_WhenManualEndEqualsStart()
    {
        var end = AppointmentWindow.ComputeEnd(Start, 60, Start);

        Assert.Equal(Start.AddHours(1), end);
    }

    [Fact]
    public void ComputeEnd_ShouldOverrideServiceDuration_WhenManualEndIsLonger()
    {
        var manualEnd = Start.AddHours(3);
        var end = AppointmentWindow.ComputeEnd(Start, 30, manualEnd);

        Assert.Equal(manualEnd, end);
        Assert.NotEqual(Start.AddMinutes(30), end);
    }

    [Fact]
    public void ComputeEnd_EffectiveEnd_MustBeGreaterThanStart()
    {
        var end = AppointmentWindow.ComputeEnd(Start, 1, null);

        Assert.True(end > Start);
    }
}
