using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Auth;
using Agendella.Api.Contracts.Common;
using Agendella.Application.Auth;
using Agendella.Application.Common.Errors;
using Agendella.Application.Salons;
using Agendella.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(
    CredentialService credentialService,
    RefreshTokenService refreshTokenService,
    JwtTokenService jwtTokenService,
    RefreshCookieWriter refreshCookieWriter,
    ISalonStore salonStore) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var collaborator = await credentialService.AuthenticateAsync(request.Email, request.Password, cancellationToken);
        var accessToken = jwtTokenService.CreateAccessToken(collaborator);
        var refresh = await refreshTokenService.CreateSessionAsync(collaborator, cancellationToken);

        refreshCookieWriter.Write(Response, refresh.PlainTextToken);
        return Ok(new TokenResponse(accessToken.AccessToken, accessToken.ExpiresAtUtc));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TokenResponse>> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = refreshCookieWriter.Read(Request);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.RefreshTokenInvalid,
                "O refresh token nao foi informado.",
                StatusCodes.Status401Unauthorized));
        }

        var rotation = await refreshTokenService.RotateAsync(refreshToken, cancellationToken);
        var collaborator = rotation.Session.Collaborator
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.RefreshTokenInvalid,
                "Nao foi possivel restaurar a sessao do refresh token.",
                401));

        var accessToken = jwtTokenService.CreateAccessToken(collaborator);
        refreshCookieWriter.Write(Response, rotation.PlainTextToken);

        return Ok(new TokenResponse(accessToken.AccessToken, accessToken.ExpiresAtUtc));
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = refreshCookieWriter.Read(Request);
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await refreshTokenService.RevokeAsync(refreshToken, cancellationToken);
        }

        refreshCookieWriter.Clear(Response);
        return NoContent();
    }

    [Authorize]
    [HttpGet("/me")]
    [ProducesResponseType<MeResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken cancellationToken)
    {
        var collaboratorId = ParseGuidClaim(JwtRegisteredClaimNames.Sub, ClaimTypes.NameIdentifier);
        var tenantId = ParseGuidClaim("tenant_id", "tenantId", "tenant");
        Guid? professionalId = User.FindFirstValue("professional_id") is { } rawProfessionalId
            ? Guid.Parse(rawProfessionalId)
            : null;
        var role = User.FindFirstValue("role") ?? string.Empty;
        var displayName = User.FindFirstValue("display_name") ?? string.Empty;

        var salon = await salonStore.FindByIdAsync(tenantId, cancellationToken);
        var salonName = salon?.Name ?? string.Empty;

        return Ok(new MeResponse(collaboratorId, tenantId, professionalId, displayName, role, "active", salonName));
    }

    private Guid ParseGuidClaim(params string[] claimTypes)
    {
        var rawValue = claimTypes
            .Select(type => User.FindFirstValue(type))
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

        if (!Guid.TryParse(rawValue, out var value))
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Unauthorized,
                "A identidade autenticada nao contem os claims obrigatorios para esta operacao.",
                StatusCodes.Status401Unauthorized,
                new Dictionary<string, object?>
                {
                    ["claims"] = claimTypes
                }));
        }

        return value;
    }
}
