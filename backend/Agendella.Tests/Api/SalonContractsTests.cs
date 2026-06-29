using Agendella.Api.Contracts.Salons;
using Agendella.Api.Validators.Salons;

namespace Agendella.Tests.Api;

public sealed class SalonContractsTests
{
    [Fact]
    public void UpdateSalonSettingsRequestValidator_ShouldRejectEmptyFields()
    {
        var validator = new UpdateSalonSettingsRequestValidator();
        var result = validator.Validate(new UpdateSalonSettingsRequest(
            string.Empty, string.Empty, string.Empty, string.Empty, -1));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.Name));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.Address));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.Phone));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.TimeZoneId));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.MinimumCancellationNoticeMinutes));
    }

    [Fact]
    public void UpdateSalonSettingsRequestValidator_ShouldRejectInvalidTimezone()
    {
        var validator = new UpdateSalonSettingsRequestValidator();
        var result = validator.Validate(new UpdateSalonSettingsRequest(
            "Salao Teste", "Rua A", "11999999999", "Invalid/Zone", 30));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.TimeZoneId));
    }

    [Fact]
    public void UpdateSalonSettingsRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new UpdateSalonSettingsRequestValidator();
        var result = validator.Validate(new UpdateSalonSettingsRequest(
            "Salao Teste", "Rua A, 100", "11999999999", "America/Sao_Paulo", 60));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ReplaceBusinessHoursRequestValidator_ShouldRejectOpenDayWithoutTimes()
    {
        var validator = new ReplaceBusinessHoursRequestValidator();
        var result = validator.Validate(new ReplaceBusinessHoursRequest(
        [
            new BusinessHourDto("Monday", null, null, false)
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ReplaceBusinessHoursRequestValidator_ShouldRejectEndBeforeStart()
    {
        var validator = new ReplaceBusinessHoursRequestValidator();
        var result = validator.Validate(new ReplaceBusinessHoursRequest(
        [
            new BusinessHourDto("Monday", "18:00", "08:00", false)
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ReplaceBusinessHoursRequestValidator_ShouldAcceptClosedDayWithoutTimes()
    {
        var validator = new ReplaceBusinessHoursRequestValidator();
        var result = validator.Validate(new ReplaceBusinessHoursRequest(
        [
            new BusinessHourDto("Sunday", null, null, true)
        ]));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ReplaceBusinessHoursRequestValidator_ShouldAcceptValidOpenDay()
    {
        var validator = new ReplaceBusinessHoursRequestValidator();
        var result = validator.Validate(new ReplaceBusinessHoursRequest(
        [
            new BusinessHourDto("Monday", "08:00", "18:00", false)
        ]));

        Assert.True(result.IsValid);
    }
}
