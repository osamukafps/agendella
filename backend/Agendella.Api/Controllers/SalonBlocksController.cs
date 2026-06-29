using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Common;
using Agendella.Api.Contracts.SalonBlocks;
using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("salon-blocks")]
[Authorize]
public sealed class SalonBlocksController(SalonBlockService salonBlockService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<SalonBlockResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<SalonBlockResponse>>> List(
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var (items, nextCursor) = await salonBlockService.ListAsync(
            Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<SalonBlockResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<SalonBlockResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SalonBlockResponse>> Create(
        [FromBody] CreateSalonBlockRequest request,
        CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var block = await salonBlockService.CreateAsync(
            request.StartAtUtc, request.EndAtUtc, request.Reason,
            collaboratorId, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, MapToResponse(block));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await salonBlockService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    private Guid GetCollaboratorId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    private static SalonBlockResponse MapToResponse(SalonBlock b) =>
        new(b.Id, b.StartAtUtc, b.EndAtUtc, b.Reason, b.CreatedAtUtc);
}
