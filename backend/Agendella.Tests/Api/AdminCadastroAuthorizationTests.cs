using System.Security.Claims;
using Agendella.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Agendella.Tests.Api;

public sealed class AdminCadastroAuthorizationTests
{
    [Theory]
    [InlineData("profissional")]
    public async Task AdministradoraOnlyPolicy_ShouldDenyNonAdminRoles(string role)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorizationPolicies();

        using var provider = services.BuildServiceProvider();
        var authorizationService = provider.GetRequiredService<IAuthorizationService>();

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("role", role)], "test"));

        var result = await authorizationService.AuthorizeAsync(
            principal, null, AuthorizationPolicies.AdministradoraOnly);

        Assert.False(result.Succeeded);
    }

    [Fact]
    public async Task AdministradoraOnlyPolicy_ShouldAllowAdministradora()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorizationPolicies();

        using var provider = services.BuildServiceProvider();
        var authorizationService = provider.GetRequiredService<IAuthorizationService>();

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("role", "administradora")], "test"));

        var resultSalon = await authorizationService.AuthorizeAsync(
            principal, null, AuthorizationPolicies.AdministradoraOnly);
        var resultService = await authorizationService.AuthorizeAsync(
            principal, null, AuthorizationPolicies.AdministradoraOnly);

        Assert.True(resultSalon.Succeeded);
        Assert.True(resultService.Succeeded);
    }

    [Fact]
    public async Task ProfissionalOnlyPolicy_ShouldDenyAdministradora()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorizationPolicies();

        using var provider = services.BuildServiceProvider();
        var authorizationService = provider.GetRequiredService<IAuthorizationService>();

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("role", "administradora")], "test"));

        var result = await authorizationService.AuthorizeAsync(
            principal, null, AuthorizationPolicies.ProfissionalOnly);

        Assert.False(result.Succeeded);
    }
}
