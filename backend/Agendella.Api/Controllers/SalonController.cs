using System.Security.Claims;
using Agendella.Api.Auth;
using Agendella.Api.Contracts.Common;
using Agendella.Api.Contracts.Salons;
using Agendella.Application.Salons;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agendella.Api.Controllers;

[ApiController]
[Route("salon")]
[Authorize]
public sealed class SalonController(
    SalonSettingsService salonSettingsService,
    BusinessHoursService businessHoursService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<SalonSettingsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SalonSettingsResponse>> GetSettings(CancellationToken cancellationToken)
    {
        var salon = await salonSettingsService.GetAsync(cancellationToken);
        return Ok(MapToResponse(salon));
    }

    [HttpPut]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<SalonSettingsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SalonSettingsResponse>> UpdateSettings(
        [FromBody] UpdateSalonSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var salon = await salonSettingsService.UpdateAsync(
            request.Name,
            request.Address,
            request.Phone,
            request.TimeZoneId,
            request.MinimumCancellationNoticeMinutes,
            cancellationToken);

        return Ok(MapToResponse(salon));
    }

    [HttpGet("business-hours")]
    [ProducesResponseType<IReadOnlyList<BusinessHourDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<BusinessHourDto>>> GetBusinessHours(CancellationToken cancellationToken)
    {
        var hours = await businessHoursService.GetAsync(cancellationToken);
        return Ok(hours.Select(MapBusinessHourToDto).ToList());
    }

    [HttpPut("business-hours")]
    [Authorize(Policy = AuthorizationPolicies.AdministradoraOnly)]
    [ProducesResponseType<IReadOnlyList<BusinessHourDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<BusinessHourDto>>> ReplaceBusinessHours(
        [FromBody] ReplaceBusinessHoursRequest request,
        CancellationToken cancellationToken)
    {
        var entries = request.BusinessHours.Select(dto => new BusinessHourEntry(
            Enum.Parse<DayOfWeek>(dto.DayOfWeek),
            dto.StartLocalTime != null ? TimeOnly.Parse(dto.StartLocalTime) : null,
            dto.EndLocalTime != null ? TimeOnly.Parse(dto.EndLocalTime) : null,
            dto.IsClosed)).ToList();

        var hours = await businessHoursService.ReplaceAsync(entries, cancellationToken);
        return Ok(hours.Select(MapBusinessHourToDto).ToList());
    }

    private static SalonSettingsResponse MapToResponse(SalonTenant salon) =>
        new(salon.Id, salon.Name, salon.Address, salon.Phone,
            salon.TimeZoneId, salon.Status.ToString(),
            salon.MinimumCancellationNoticeMinutes,
            salon.CreatedAtUtc, salon.UpdatedAtUtc);

    private static BusinessHourDto MapBusinessHourToDto(SalonBusinessHour h) =>
        new(h.DayOfWeek.ToString(),
            h.StartLocalTime?.ToString("HH:mm"),
            h.EndLocalTime?.ToString("HH:mm"),
            h.IsClosed);
}
