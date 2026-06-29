using Agendella.Api.Contracts.Clients;
using Agendella.Api.Validators.Clients;

namespace Agendella.Tests.Api;

public sealed class ClientsContractsTests
{
    [Fact]
    public void CreateClientRequestValidator_ShouldRejectEmptyNameAndPhone()
    {
        var validator = new CreateClientRequestValidator();
        var result = validator.Validate(new CreateClientRequest(string.Empty, string.Empty, string.Empty, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClientRequest.Name));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClientRequest.Phone));
    }

    [Fact]
    public void CreateClientRequestValidator_ShouldRejectInvalidEmailWhenProvided()
    {
        var validator = new CreateClientRequestValidator();
        var result = validator.Validate(new CreateClientRequest("Maria", "11999999999", "not-valid-email", ""));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClientRequest.Email));
    }

    [Fact]
    public void CreateClientRequestValidator_ShouldAcceptEmptyEmail()
    {
        var validator = new CreateClientRequestValidator();
        var result = validator.Validate(new CreateClientRequest("Maria", "11999999999", string.Empty, string.Empty));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateClientRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new CreateClientRequestValidator();
        var result = validator.Validate(new CreateClientRequest("Maria Souza", "11999999999", "maria@email.com", "Cliente regular"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateClientRequestValidator_ShouldRejectEmptyNameAndPhone()
    {
        var validator = new UpdateClientRequestValidator();
        var result = validator.Validate(new UpdateClientRequest(string.Empty, string.Empty, string.Empty, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClientRequest.Name));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClientRequest.Phone));
    }

    [Fact]
    public void UpdateClientRequestValidator_ShouldAcceptValidRequest()
    {
        var validator = new UpdateClientRequestValidator();
        var result = validator.Validate(new UpdateClientRequest("Maria Souza", "11888888888", string.Empty, "Atualizado"));

        Assert.True(result.IsValid);
    }
}
