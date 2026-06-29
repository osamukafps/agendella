using Microsoft.AspNetCore.Authorization;

namespace Agendella.Api.Auth;

public static class AuthorizationPolicies
{
    public const string AdministradoraOnly = "AdministradoraOnly";
    public const string ProfissionalOnly = "ProfissionalOnly";

    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(AdministradoraOnly, policy => policy.RequireClaim("role", "administradora"));
            options.AddPolicy(ProfissionalOnly, policy => policy.RequireClaim("role", "profissional"));
        });

        return services;
    }
}
