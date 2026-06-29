using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Api.Controllers;
using Agendella.Api.Contracts.Auth;
using Agendella.Application.Salons;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Tests.Api;

public sealed class AuthMeTests
{
    private static readonly ISalonStore StubSalon = new StubSalonStore("Salão de Teste");

    [Fact]
    public async Task Me_ShouldReadStandardJwtClaimsWithoutThrowing()
    {
        var controller = new AuthController(null!, null!, null!, null!, StubSalon);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.Sub, Guid.Parse("33333333-3333-3333-3333-333333333333").ToString()),
                    new Claim("tenant_id", Guid.Parse("44444444-4444-4444-4444-444444444444").ToString()),
                    new Claim("role", "administradora")
                ], "test"))
            }
        };

        var result = await controller.Me(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<MeResponse>(okResult.Value);

        Assert.Equal(Guid.Parse("33333333-3333-3333-3333-333333333333"), payload.CollaboratorId);
        Assert.Equal(Guid.Parse("44444444-4444-4444-4444-444444444444"), payload.TenantId);
        Assert.Equal("administradora", payload.Role);
        Assert.Equal("Salão de Teste", payload.SalonName);
    }

    [Fact]
    public async Task Me_ShouldAcceptMappedNameIdentifierFallback()
    {
        var controller = new AuthController(null!, null!, null!, null!, StubSalon);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, Guid.Parse("55555555-5555-5555-5555-555555555555").ToString()),
                    new Claim("tenant", Guid.Parse("66666666-6666-6666-6666-666666666666").ToString()),
                    new Claim("role", "profissional")
                ], "test"))
            }
        };

        var result = await controller.Me(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<MeResponse>(okResult.Value);

        Assert.Equal(Guid.Parse("55555555-5555-5555-5555-555555555555"), payload.CollaboratorId);
        Assert.Equal(Guid.Parse("66666666-6666-6666-6666-666666666666"), payload.TenantId);
        Assert.Equal("profissional", payload.Role);
    }

    private sealed class StubSalonStore(string salonName) : ISalonStore
    {
        public Task<SalonTenant?> FindByIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
            => Task.FromResult<SalonTenant?>(new SalonTenant { Name = salonName });

        public Task<IReadOnlyList<SalonBusinessHour>> GetBusinessHoursAsync(Guid tenantId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SalonBusinessHour>>(new List<SalonBusinessHour>());

        public Task ReplaceBusinessHoursAsync(Guid tenantId, IReadOnlyList<SalonBusinessHour> hours, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
