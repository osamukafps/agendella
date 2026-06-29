using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Clients;
using Agendella.Api.Contracts.Common;
using Agendella.Application.Clients;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("clients")]
[Authorize]
public sealed class ClientsController(ClientManagementService clientService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<ClientResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<ClientResponse>>> List(
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var (items, nextCursor) = await clientService.ListAsync(
            Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<ClientResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost]
    [ProducesResponseType<ClientResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClientResponse>> Create(
        [FromBody] CreateClientRequest request,
        CancellationToken cancellationToken)
    {
        var client = await clientService.CreateAsync(
            request.Name, request.Phone, request.Email, request.Notes, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = client.Id }, MapToResponse(client));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ClientResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var client = await clientService.GetAsync(id, cancellationToken);
        return Ok(MapToResponse(client));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<ClientResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClientResponse>> Update(
        Guid id,
        [FromBody] UpdateClientRequest request,
        CancellationToken cancellationToken)
    {
        var client = await clientService.UpdateAsync(
            id, request.Name, request.Phone, request.Email, request.Notes, cancellationToken);

        return Ok(MapToResponse(client));
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        await clientService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    [ProducesResponseType<PaginatedResponse<ClientHistoryEventResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaginatedResponse<ClientHistoryEventResponse>>> GetHistory(
        Guid id,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var requesterProfessionalId = GetRequesterProfessionalId();
        var (items, nextCursor) = await clientService.GetHistoryAsync(
            id, requesterProfessionalId, Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<ClientHistoryEventResponse>(
            items.Select(MapHistoryToResponse).ToList(), nextCursor));
    }

    private Guid? GetRequesterProfessionalId()
    {
        var rawProfessionalId = User.FindFirstValue("professional_id");
        return rawProfessionalId != null ? Guid.Parse(rawProfessionalId) : null;
    }

    private static ClientResponse MapToResponse(Client c) =>
        new(c.Id, c.Name, c.Phone, c.Email, c.Notes, c.Status.ToString(), c.CreatedAtUtc, c.UpdatedAtUtc);

    private static ClientHistoryEventResponse MapHistoryToResponse(ClientHistoryEvent e) =>
        new(e.Id, e.ClientId, e.AppointmentId, e.Type.ToString(), e.OccurredAtUtc, e.Description, e.CreatedAtUtc);
}
