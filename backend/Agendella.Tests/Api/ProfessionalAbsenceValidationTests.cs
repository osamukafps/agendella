using Agendella.Api.Contracts.ProfessionalAbsences;
using Agendella.Api.Validators.ProfessionalAbsences;

namespace Agendella.Tests.Api;

public sealed class ProfessionalAbsenceValidationTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldRejectReasonTooLong()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var longReason = new string('Z', 1001);
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Now.AddHours(1), Now.AddHours(3), longReason));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalAbsenceRequest.Reason));
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldRejectEndEqualToStart()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Now.AddHours(1), Now.AddHours(1), "Ferias"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalAbsenceRequest.EndAtUtc));
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldAcceptMultiDayAbsence()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Now.AddDays(1), Now.AddDays(7), "Ferias de uma semana"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldAcceptShortAbsence()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Now.AddHours(2), Now.AddHours(3), "Dentista"));

        Assert.True(result.IsValid);
    }
}
