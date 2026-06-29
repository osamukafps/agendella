using Agendella.Api.Contracts.Appointments;
using Agendella.Api.Validators.Appointments;
using Agendella.Api.Validators.Availability;

namespace Agendella.Tests.Api;

public sealed class SchedulingValidationTests
{
    private static readonly DateTimeOffset FutureTime = DateTimeOffset.UtcNow.AddDays(1);

    [Fact]
    public void CreateAppointmentValidator_ShouldRejectAllEmptyGuids()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.Empty, Guid.Empty, Guid.Empty, FutureTime, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAppointmentRequest.ClientId));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAppointmentRequest.ProfessionalId));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAppointmentRequest.ServiceId));
    }

    [Fact]
    public void AvailabilityQueryValidator_ShouldRejectZeroDuration()
    {
        var validator = new AvailabilityQueryValidator();
        var result = validator.Validate(new AvailabilityQuery(Guid.NewGuid(), DateOnly.FromDateTime(DateTime.Today.AddDays(1)), 0));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AvailabilityQuery.DurationMinutes));
    }

    [Fact]
    public void AvailabilityQueryValidator_ShouldRejectEmptyProfessionalId()
    {
        var validator = new AvailabilityQueryValidator();
        var result = validator.Validate(new AvailabilityQuery(Guid.Empty, DateOnly.FromDateTime(DateTime.Today.AddDays(1)), 60));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AvailabilityQuery.ProfessionalId));
    }

    [Fact]
    public void AvailabilityQueryValidator_ShouldAcceptValidQuery()
    {
        var validator = new AvailabilityQueryValidator();
        var result = validator.Validate(new AvailabilityQuery(Guid.NewGuid(), DateOnly.FromDateTime(DateTime.Today.AddDays(1)), 60));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateAppointmentValidator_ShouldAcceptNullManualEnd()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), FutureTime, null));

        Assert.True(result.IsValid);
    }
}
