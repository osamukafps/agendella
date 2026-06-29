using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Agendella.Api.Contracts.Common;
using Agendella.Api.Contracts.ProfessionalAbsences;
using Agendella.Application.Scheduling;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Authorize]
public sealed class ProfessionalAbsencesController(ProfessionalAbsenceService absenceService) : ControllerBase
{
    [HttpGet("professionals/{professionalId:guid}/absences")]
    [ProducesResponseType<PaginatedResponse<ProfessionalAbsenceResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<ProfessionalAbsenceResponse>>> List(
        Guid professionalId,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var (items, nextCursor) = await absenceService.ListAsync(
            professionalId, Math.Clamp(pageSize, 1, 100), cursor, cancellationToken);

        return Ok(new PaginatedResponse<ProfessionalAbsenceResponse>(
            items.Select(MapToResponse).ToList(), nextCursor));
    }

    [HttpPost("professional-absences")]
    [ProducesResponseType<ProfessionalAbsenceResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfessionalAbsenceResponse>> Create(
        [FromBody] CreateProfessionalAbsenceRequest request,
        CancellationToken cancellationToken)
    {
        var collaboratorId = GetCollaboratorId();
        var requesterProfessionalId = GetRequesterProfessionalId();

        var absence = await absenceService.CreateAsync(
            request.ProfessionalId,
            request.StartAtUtc, request.EndAtUtc,
            request.Reason, collaboratorId,
            requesterProfessionalId, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, MapToResponse(absence));
    }

    [HttpPost("professionals/{professionalId:guid}/absences/{absenceId:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(
        Guid professionalId,
        Guid absenceId,
        CancellationToken cancellationToken)
    {
        var requesterProfessionalId = GetRequesterProfessionalId();
        await absenceService.CancelAsync(professionalId, absenceId, requesterProfessionalId, cancellationToken);
        return NoContent();
    }

    private Guid GetCollaboratorId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    private Guid? GetRequesterProfessionalId()
    {
        var raw = User.FindFirstValue("professional_id");
        return raw != null ? Guid.Parse(raw) : null;
    }

    private static ProfessionalAbsenceResponse MapToResponse(ProfessionalAbsence a) =>
        new(a.Id, a.ProfessionalId, a.StartAtUtc, a.EndAtUtc,
            a.Reason, a.Status.ToString(), a.CancelledAtUtc, a.CreatedAtUtc);
}
