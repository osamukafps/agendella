using Agendella.Api.Contracts.Appointments;
using Agendella.Api.Validators.Appointments;

namespace Agendella.Tests.Api;

public sealed class AppointmentsContractsTests
{
    private static readonly DateTimeOffset FutureTime = DateTimeOffset.UtcNow.AddDays(1);

    [Fact]
    public void CreateAppointmentRequestValidator_ShouldRejectEmptyClientId()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), FutureTime, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAppointmentRequest.ClientId));
    }

    [Fact]
    public void CreateAppointmentRequestValidator_ShouldRejectManualEndBeforeStart()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            FutureTime, FutureTime.AddMinutes(-30)));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAppointmentRequest.ManualEndAtUtc));
    }

    [Fact]
    public void CreateAppointmentRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), FutureTime, null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateAppointmentRequestValidator_ShouldAcceptValidRequestWithManualEnd()
    {
        var validator = new CreateAppointmentRequestValidator();
        var result = validator.Validate(new CreateAppointmentRequest(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            FutureTime, FutureTime.AddHours(2)));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void RescheduleRequestValidator_ShouldRejectManualEndEqualToNewStart()
    {
        var validator = new RescheduleAppointmentRequestValidator();
        var result = validator.Validate(new RescheduleAppointmentRequest(FutureTime, FutureTime));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RescheduleAppointmentRequest.NewManualEndAtUtc));
    }

    [Fact]
    public void RescheduleRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new RescheduleAppointmentRequestValidator();
        var result = validator.Validate(new RescheduleAppointmentRequest(FutureTime, null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void RescheduleRequestValidator_ShouldAcceptWithManualEndAfterNewStart()
    {
        var validator = new RescheduleAppointmentRequestValidator();
        var result = validator.Validate(new RescheduleAppointmentRequest(
            FutureTime, FutureTime.AddHours(1)));

        Assert.True(result.IsValid);
    }
}
