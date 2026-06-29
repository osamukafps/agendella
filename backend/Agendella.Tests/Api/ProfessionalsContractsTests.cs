using Agendella.Api.Contracts.Professionals;
using Agendella.Api.Validators.Professionals;

namespace Agendella.Tests.Api;

public sealed class ProfessionalsContractsTests
{
    [Fact]
    public void CreateProfessionalRequestValidator_ShouldRejectEmptyFields()
    {
        var validator = new CreateProfessionalRequestValidator();
        var result = validator.Validate(new CreateProfessionalRequest(string.Empty, string.Empty, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalRequest.Name));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalRequest.Phone));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalRequest.Email));
    }

    [Fact]
    public void CreateProfessionalRequestValidator_ShouldRejectInvalidEmail()
    {
        var validator = new CreateProfessionalRequestValidator();
        var result = validator.Validate(new CreateProfessionalRequest("Ana", "11999999999", "not-an-email"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalRequest.Email));
    }

    [Fact]
    public void CreateProfessionalRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateProfessionalRequestValidator();
        var result = validator.Validate(new CreateProfessionalRequest("Ana Silva", "11999999999", "ana@salon.com"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ReplaceWeeklyAvailabilityRequestValidator_ShouldRejectEndBeforeStart()
    {
        var validator = new ReplaceWeeklyAvailabilityRequestValidator();
        var result = validator.Validate(new ReplaceWeeklyAvailabilityRequest(
        [
            new WeeklyAvailabilityEntryDto("Monday", "17:00", "09:00")
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ReplaceWeeklyAvailabilityRequestValidator_ShouldRejectInvalidDay()
    {
        var validator = new ReplaceWeeklyAvailabilityRequestValidator();
        var result = validator.Validate(new ReplaceWeeklyAvailabilityRequest(
        [
            new WeeklyAvailabilityEntryDto("Quarta", "09:00", "17:00")
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ReplaceWeeklyAvailabilityRequestValidator_ShouldAcceptValidSlots()
    {
        var validator = new ReplaceWeeklyAvailabilityRequestValidator();
        var result = validator.Validate(new ReplaceWeeklyAvailabilityRequest(
        [
            new WeeklyAvailabilityEntryDto("Monday", "09:00", "17:00"),
            new WeeklyAvailabilityEntryDto("Tuesday", "09:00", "17:00")
        ]));

        Assert.True(result.IsValid);
    }
}
