using System.IdentityModel.Tokens.Jwt;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Auth;
using Microsoft.Extensions.Options;

namespace Agendella.Tests.Infrastructure;

public sealed class JwtTokenServiceTests
{
    [Fact]
    public void JwtTokenService_ShouldEmitTenantAndRoleClaims()
    {
        var options = Options.Create(new JwtOptions
        {
            Issuer = "Agendella.Tests",
            Audience = "Agendella.Tests.Frontend",
            AccessTokenMinutes = 15,
            PrivateKeyPath = string.Empty,
            PublicKeyPath = string.Empty
        });

        var provider = JwtSigningKeyProvider.Create(options.Value);
        var service = new JwtTokenService(options, provider);

        var collaborator = new SalonCollaborator
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "admin@test.local",
            Role = CollaboratorRole.Administradora,
            Status = RecordStatus.Active,
            TokenVersion = 2
        };

        var token = service.CreateAccessToken(collaborator);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token.AccessToken);

        Assert.Equal(options.Value.Issuer, jwt.Issuer);
        Assert.Contains(jwt.Claims, claim => claim.Type == "tenant_id" && claim.Value == collaborator.TenantId.ToString());
        Assert.Contains(jwt.Claims, claim => claim.Type == "role" && claim.Value == "administradora");
        Assert.Contains(jwt.Claims, claim => claim.Type == "token_version" && claim.Value == "2");
    }
}
