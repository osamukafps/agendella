using Agendella.Api.Contracts.Auth;
using Agendella.Api.Validators.Auth;

namespace Agendella.Tests.Api;

public sealed class AuthValidationTests
{
    [Fact]
    public void LoginRequestValidator_ShouldRejectEmptyCredentials()
    {
        var validator = new LoginRequestValidator();
        var result = validator.Validate(new LoginRequest(string.Empty, string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(LoginRequest.Email));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(LoginRequest.Password));
    }

    [Fact]
    public void RefreshRequestValidator_ShouldAcceptEmptyPayload()
    {
        var validator = new RefreshRequestValidator();
        var result = validator.Validate(new RefreshRequest());

        Assert.True(result.IsValid);
    }
}
