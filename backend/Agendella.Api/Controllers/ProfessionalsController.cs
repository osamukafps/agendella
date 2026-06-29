using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Common;
using Agendella.Api.Contracts.Professionals;
using Agendella.Application.Professionals;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("professionals")]
[Authorize]
public sealed class ProfessionalsController(
    ProfessionalManagementService professionalService,
    WeeklyAvailabilityService availabilityService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<ProfessionalResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<ProfessionalResponse>>> List(
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var (items, nextCursor) = await professionalService.ListAsync(
            Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<ProfessionalResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ProfessionalResponse>> Create(
        [FromBody] CreateProfessionalRequest request,
        CancellationToken cancellationToken)
    {
        var professional = await professionalService.CreateAsync(
            request.Name, request.Phone, request.Email, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = professional.Id }, MapToResponse(professional));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfessionalResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var professional = await professionalService.GetAsync(id, cancellationToken);
        return Ok(MapToResponse(professional));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfessionalResponse>> Update(
        Guid id,
        [FromBody] UpdateProfessionalRequest request,
        CancellationToken cancellationToken)
    {
        var professional = await professionalService.UpdateAsync(
            id, request.Name, request.Phone, request.Email, cancellationToken);

        return Ok(MapToResponse(professional));
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        await professionalService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/weekly-availability")]
    [ProducesResponseType<WeeklyAvailabilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WeeklyAvailabilityResponse>> GetWeeklyAvailability(
        Guid id,
        CancellationToken cancellationToken)
    {
        var requesterProfessionalId = GetRequesterProfessionalId();
        var slots = await availabilityService.GetAsync(id, requesterProfessionalId, cancellationToken);
        return Ok(new WeeklyAvailabilityResponse(slots.Select(MapAvailabilityToDto).ToList()));
    }

    [HttpPut("{id:guid}/weekly-availability")]
    [ProducesResponseType<WeeklyAvailabilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WeeklyAvailabilityResponse>> ReplaceWeeklyAvailability(
        Guid id,
        [FromBody] ReplaceWeeklyAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        var requesterProfessionalId = GetRequesterProfessionalId();

        var entries = request.Slots.Select(s => new AvailabilityEntry(
            Enum.Parse<DayOfWeek>(s.DayOfWeek),
            TimeOnly.Parse(s.StartLocalTime),
            TimeOnly.Parse(s.EndLocalTime))).ToList();

        var slots = await availabilityService.ReplaceAsync(id, requesterProfessionalId, entries, cancellationToken);
        return Ok(new WeeklyAvailabilityResponse(slots.Select(MapAvailabilityToDto).ToList()));
    }

    private Guid? GetRequesterProfessionalId()
    {
        var rawProfessionalId = User.FindFirstValue("professional_id");
        return rawProfessionalId != null ? Guid.Parse(rawProfessionalId) : null;
    }

    private static ProfessionalResponse MapToResponse(Professional p) =>
        new(p.Id, p.Name, p.Phone, p.Email, p.Status.ToString(), p.CreatedAtUtc, p.UpdatedAtUtc);

    private static WeeklyAvailabilityEntryDto MapAvailabilityToDto(ProfessionalWeeklyAvailability a) =>
        new(a.DayOfWeek.ToString(), a.StartLocalTime.ToString("HH:mm"), a.EndLocalTime.ToString("HH:mm"));
}
