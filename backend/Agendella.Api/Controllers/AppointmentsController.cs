using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Appointments;
using Agendella.Api.Contracts.Common;
using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("appointments")]
[Authorize]
public sealed class AppointmentsController(
    AppointmentSchedulingService schedulingService,
    AppointmentCancellationService cancellationService,
    AppointmentOutcomeService outcomeService,
    AppointmentReviewService reviewService,
    IAppointmentStore appointmentStore) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<AppointmentResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<AppointmentResponse>>> List(
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var requesterProfessionalId = GetRequesterProfessionalId();
        var (items, nextCursor) = await appointmentStore.ListAsync(
            requesterProfessionalId, Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<AppointmentResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Create(
        [FromBody] CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();

        var appointment = await schedulingService.CreateAsync(
            request.ClientId, request.ProfessionalId, request.ServiceId,
            request.StartAtUtc, request.ManualEndAtUtc, collaboratorId, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = appointment.Id }, MapToResponse(appointment));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var appointment = await appointmentStore.FindByIdAsync(id, cancellationToken);
        if (appointment is null)
        {
            return NotFound();
        }

        var requesterProfessionalId = GetRequesterProfessionalId();
        if (requesterProfessionalId.HasValue && appointment.ProfessionalId != requesterProfessionalId.Value)
        {
            return NotFound();
        }

        return Ok(MapToResponse(appointment));
    }

    [HttpPost("{id:guid}/reschedule")]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Reschedule(
        Guid id,
        [FromBody] RescheduleAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var requesterProfessionalId = GetRequesterProfessionalId();

        var appointment = await schedulingService.RescheduleAsync(
            id, request.NewStartAtUtc, request.NewManualEndAtUtc,
            collaboratorId, requesterProfessionalId, cancellationToken);

        return Ok(MapToResponse(appointment));
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var requesterProfessionalId = GetRequesterProfessionalId();
        var isAdmin = User.FindFirstValue("role") == "administradora";

        await cancellationService.CancelAsync(id, collaboratorId, requesterProfessionalId, isAdmin, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var requesterProfessionalId = GetRequesterProfessionalId();

        await outcomeService.CompleteAsync(id, collaboratorId, requesterProfessionalId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/no-show")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> NoShow(Guid id, CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var requesterProfessionalId = GetRequesterProfessionalId();

        await outcomeService.MarkNoShowAsync(id, collaboratorId, requesterProfessionalId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/resolve-review")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResolveReview(Guid id, CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        await reviewService.ResolveReviewAsync(id, collaboratorId, cancellationToken);
        return NoContent();
    }

    private Guid GetCollaboratorId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    private Guid? GetRequesterProfessionalId()
    {
        var raw = User.FindFirstValue("professional_id");
        return raw != null ? Guid.Parse(raw) : null;
    }

    private static AppointmentResponse MapToResponse(Appointment a) =>
        new(a.Id, a.ClientId, a.ProfessionalId, a.ServiceId,
            a.StartAtUtc, a.EndAtUtc, a.Status.ToString(),
            a.RequiresReview, a.ReviewReason,
            a.CreatedAtUtc, a.UpdatedAtUtc);
}
