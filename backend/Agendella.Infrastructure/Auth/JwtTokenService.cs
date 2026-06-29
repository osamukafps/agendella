using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Agendella.Infrastructure.Auth;

public sealed class JwtTokenService(IOptions<JwtOptions> options, JwtSigningKeyProvider signingKeyProvider)
{
    private readonly JwtOptions _options = options.Value;

    public (string AccessToken, DateTimeOffset ExpiresAtUtc) CreateAccessToken(SalonCollaborator collaborator)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, collaborator.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, collaborator.Email),
            new("tenant_id", collaborator.TenantId.ToString()),
            new("role", ToRoleValue(collaborator.Role)),
            new("token_version", collaborator.TokenVersion.ToString())
        };

        if (collaborator.ProfessionalId.HasValue)
        {
            claims.Add(new Claim("professional_id", collaborator.ProfessionalId.Value.ToString()));
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAtUtc.UtcDateTime,
            SigningCredentials = signingKeyProvider.SigningCredentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(descriptor);

        return (handler.WriteToken(token), expiresAtUtc);
    }

    private static string ToRoleValue(CollaboratorRole role) => role switch
    {
        CollaboratorRole.Administradora => "administradora",
        CollaboratorRole.Profissional => "profissional",
        _ => throw new ArgumentOutOfRangeException(nameof(role), role, null)
    };
}
