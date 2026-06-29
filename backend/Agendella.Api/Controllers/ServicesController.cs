using Agendella.Api.Auth;
using Agendella.Api.Contracts.Common;
using Agendella.Api.Contracts.Services;
using Agendella.Application.Services;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("services")]
[Authorize]
public sealed class ServicesController(ServiceCatalogService serviceCatalogService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<ServiceResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<ServiceResponse>>> List(
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var (items, nextCursor) = await serviceCatalogService.ListAsync(
            Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<ServiceResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ServiceResponse>> Create(
        [FromBody] CreateServiceRequest request,
        CancellationToken cancellationToken)
    {
        var service = await serviceCatalogService.CreateAsync(
            request.Name, request.Description, request.DurationMinutes,
            request.PriceAmount, request.Currency, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = service.Id }, MapToResponse(service));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var service = await serviceCatalogService.GetAsync(id, cancellationToken);
        return Ok(MapToResponse(service));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceResponse>> Update(
        Guid id,
        [FromBody] UpdateServiceRequest request,
        CancellationToken cancellationToken)
    {
        var service = await serviceCatalogService.UpdateAsync(
            id, request.Name, request.Description, request.DurationMinutes,
            request.PriceAmount, request.Currency, cancellationToken);

        return Ok(MapToResponse(service));
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        await serviceCatalogService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }

    private static ServiceResponse MapToResponse(Domain.Entities.Service s) =>
        new(s.Id, s.Name, s.Description, s.DurationMinutes,
            s.PriceAmount, s.Currency, s.Status.ToString(),
            s.CreatedAtUtc, s.UpdatedAtUtc);
}
