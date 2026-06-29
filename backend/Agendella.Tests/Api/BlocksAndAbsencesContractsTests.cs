using Agendella.Api.Contracts.ProfessionalAbsences;
using Agendella.Api.Contracts.SalonBlocks;
using Agendella.Api.Validators.ProfessionalAbsences;
using Agendella.Api.Validators.SalonBlocks;

namespace Agendella.Tests.Api;

public sealed class BlocksAndAbsencesContractsTests
{
    private static readonly DateTimeOffset Start = DateTimeOffset.UtcNow.AddDays(1);
    private static readonly DateTimeOffset End = Start.AddHours(3);

    [Fact]
    public void CreateSalonBlockValidator_ShouldRejectEndBeforeStart()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(End, Start, "Reforma"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateSalonBlockRequest.EndAtUtc));
    }

    [Fact]
    public void CreateSalonBlockValidator_ShouldRejectEqualStartAndEnd()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(Start, Start, "Reforma"));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateSalonBlockValidator_ShouldRejectEmptyReason()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(Start, End, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateSalonBlockRequest.Reason));
    }

    [Fact]
    public void CreateSalonBlockValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(Start, End, "Manutencao"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldRejectEmptyProfessionalId()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.Empty, Start, End, "Ferias"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalAbsenceRequest.ProfessionalId));
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldRejectEndBeforeStart()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), End, Start, "Ferias"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalAbsenceRequest.EndAtUtc));
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldRejectEmptyReason()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Start, End, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateProfessionalAbsenceRequest.Reason));
    }

    [Fact]
    public void CreateProfessionalAbsenceValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateProfessionalAbsenceRequestValidator();
        var result = validator.Validate(new CreateProfessionalAbsenceRequest(
            Guid.NewGuid(), Start, End, "Consulta medica"));

        Assert.True(result.IsValid);
    }
}
