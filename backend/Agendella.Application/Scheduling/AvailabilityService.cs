using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;

namespace Agendella.Application.Scheduling;

public sealed record AvailableSlot(DateTimeOffset StartAtUtc, DateTimeOffset EndAtUtc);

public sealed class AvailabilityService(ITenantContext tenantContext, ISchedulingDataStore dataStore)
{
    public async Task<IReadOnlyList<AvailableSlot>> SearchAsync(
        Guid professionalId,
        DateOnly date,
        int durationMinutes,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContext.TenantId
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.Unauthorized, "Sem tenant.", 401));

        var salon = await dataStore.GetSalonAsync(tenantId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Salao nao encontrado.", 404));

        var professional = await dataStore.GetProfessionalAsync(professionalId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Profissional nao encontrado.", 404));

        if (professional.Status != RecordStatus.Active)
        {
            return [];
        }

        var tz = TimeZoneInfo.FindSystemTimeZoneById(salon.TimeZoneId);
        var dayStartLocal = date.ToDateTime(TimeOnly.MinValue);
        var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(dayStartLocal, tz);
        var dayEndUtc = dayStartUtc.AddDays(1);

        var businessHours = await dataStore.GetBusinessHoursAsync(tenantId, cancellationToken);
        var profAvailability = await dataStore.GetProfessionalAvailabilityAsync(professionalId, cancellationToken);
        var blocks = await dataStore.GetSalonBlocksInWindowAsync(tenantId, dayStartUtc, dayEndUtc, cancellationToken);
        var absences = await dataStore.GetActiveAbsencesInWindowAsync(professionalId, dayStartUtc, dayEndUtc, cancellationToken);
        var appointments = await dataStore.GetScheduledAppointmentsInWindowAsync(professionalId, dayStartUtc, dayEndUtc, null, cancellationToken);

        var rawSlots = AvailabilityEvaluator.GenerateSlots(
            date, salon.TimeZoneId,
            businessHours, profAvailability,
            blocks, absences, appointments,
            durationMinutes);

        return rawSlots.Select(s => new AvailableSlot(s.Start, s.End)).ToList();
    }
}
