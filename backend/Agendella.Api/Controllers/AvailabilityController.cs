using Agendella.Api.Contracts.Availability;
using Agendella.Api.Contracts.Common;
using Agendella.Application.Scheduling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("availability")]
[Authorize]
public sealed class AvailabilityController(AvailabilityService availabilityService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AvailabilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AvailabilityResponse>> Get(
        [FromQuery] Guid professionalId,
        [FromQuery] DateOnly date,
        [FromQuery] int durationMinutes,
        CancellationToken cancellationToken)
    {
        if (professionalId == Guid.Empty || durationMinutes <= 0)
        {
            return BadRequest();
        }

        var slots = await availabilityService.SearchAsync(professionalId, date, durationMinutes, cancellationToken);

        return Ok(new AvailabilityResponse(
            professionalId,
            date,
            durationMinutes,
            slots.Select(s => new AvailabilitySlotDto(s.StartAtUtc, s.EndAtUtc)).ToList()));
    }
}
