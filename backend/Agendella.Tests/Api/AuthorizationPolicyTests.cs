using System.Security.Claims;
using Agendella.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Agendella.Tests.Api;

public sealed class AuthorizationPolicyTests
{
    [Fact]
    public async Task AuthorizationPolicies_ShouldDenyProfessionalAccessToAdministradoraOnlyPolicy()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorizationPolicies();

        using var provider = services.BuildServiceProvider();
        var authorizationService = provider.GetRequiredService<IAuthorizationService>();

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("role", "profissional")
        ],
        "test"));

        var result = await authorizationService.AuthorizeAsync(principal, null, AuthorizationPolicies.AdministradoraOnly);
        Assert.False(result.Succeeded);
    }
}
