using Agendella.Api.Contracts.Clients;
using Agendella.Api.Contracts.Professionals;
using Agendella.Api.Contracts.Salons;
using Agendella.Api.Contracts.Services;
using Agendella.Api.Validators.Clients;
using Agendella.Api.Validators.Professionals;
using Agendella.Api.Validators.Salons;
using Agendella.Api.Validators.Services;

namespace Agendella.Tests.Api;

public sealed class CadastroValidationTests
{
    [Fact]
    public void SalonValidator_ShouldFailWithNegativeCancellationNotice()
    {
        var validator = new UpdateSalonSettingsRequestValidator();
        var result = validator.Validate(new UpdateSalonSettingsRequest(
            "Salao", "Rua A", "11999", "America/Sao_Paulo", -10));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateSalonSettingsRequest.MinimumCancellationNoticeMinutes));
    }

    [Fact]
    public void BusinessHoursValidator_ShouldFailWithInvalidDayName()
    {
        var validator = new ReplaceBusinessHoursRequestValidator();
        var result = validator.Validate(new ReplaceBusinessHoursRequest(
        [
            new BusinessHourDto("Segunda", "08:00", "18:00", false)
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ServiceValidator_ShouldFailWithNegativePrice()
    {
        var validator = new CreateServiceRequestValidator();
        var result = validator.Validate(new CreateServiceRequest("Corte", "", 30, -50m, "BRL"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateServiceRequest.PriceAmount));
    }

    [Fact]
    public void ProfessionalValidator_ShouldFailWithTooLongName()
    {
        var validator = new CreateProfessionalRequestValidator();
        var longName = new string('A', 201);
        var result = validator.Validate(new CreateProfessionalRequest(longName, "11999999999", "a@b.com"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalRequest.Name));
    }

    [Fact]
    public void WeeklyAvailabilityValidator_ShouldFailWithEqualStartAndEnd()
    {
        var validator = new ReplaceWeeklyAvailabilityRequestValidator();
        var result = validator.Validate(new ReplaceWeeklyAvailabilityRequest(
        [
            new WeeklyAvailabilityEntryDto("Monday", "09:00", "09:00")
        ]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ClientValidator_ShouldFailWithTooLongNotes()
    {
        var validator = new CreateClientRequestValidator();
        var longNotes = new string('X', 2001);
        var result = validator.Validate(new CreateClientRequest("Maria", "11999999999", "", longNotes));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClientRequest.Notes));
    }

    [Fact]
    public void AllCadastroValidators_ShouldPassWithMinimalValidInput()
    {
        Assert.True(new UpdateSalonSettingsRequestValidator()
            .Validate(new UpdateSalonSettingsRequest("S", "R", "1", "America/Sao_Paulo", 0)).IsValid);

        Assert.True(new CreateServiceRequestValidator()
            .Validate(new CreateServiceRequest("Corte", "", 1, 0m, "BRL")).IsValid);

        Assert.True(new CreateProfessionalRequestValidator()
            .Validate(new CreateProfessionalRequest("Ana", "1", "a@b.com")).IsValid);

        Assert.True(new CreateClientRequestValidator()
            .Validate(new CreateClientRequest("Maria", "1", "", "")).IsValid);
    }
}
