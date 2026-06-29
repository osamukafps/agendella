using Agendella.Api.Contracts.Services;
using Agendella.Api.Validators.Services;

namespace Agendella.Tests.Api;

public sealed class ServicesContractsTests
{
    [Fact]
    public void CreateServiceRequestValidator_ShouldRejectEmptyName()
    {
        var validator = new CreateServiceRequestValidator();
        var result = validator.Validate(new CreateServiceRequest(string.Empty, string.Empty, 0, -1m, "BR"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateServiceRequest.Name));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateServiceRequest.DurationMinutes));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateServiceRequest.PriceAmount));
    }

    [Fact]
    public void CreateServiceRequestValidator_ShouldRejectInvalidCurrencyLength()
    {
        var validator = new CreateServiceRequestValidator();
        var result = validator.Validate(new CreateServiceRequest("Corte", "", 60, 50m, "BRL_EXTRA"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateServiceRequest.Currency));
    }

    [Fact]
    public void CreateServiceRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateServiceRequestValidator();
        var result = validator.Validate(new CreateServiceRequest("Corte de Cabelo", "Corte simples", 60, 50m, "BRL"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateServiceRequestValidator_ShouldRejectZeroDuration()
    {
        var validator = new UpdateServiceRequestValidator();
        var result = validator.Validate(new UpdateServiceRequest("Corte", "", 0, 50m, "BRL"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateServiceRequest.DurationMinutes));
    }

    [Fact]
    public void UpdateServiceRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new UpdateServiceRequestValidator();
        var result = validator.Validate(new UpdateServiceRequest("Escova", "Escova progressiva", 90, 120m, "BRL"));

        Assert.True(result.IsValid);
    }
}
