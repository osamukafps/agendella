using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Scheduling;

public sealed class AppointmentCancellationService(
    ITenantContext tenantContext,
    IAppointmentStore appointmentStore,
    ISchedulingDataStore dataStore)
{
    public async Task CancelAsync(
        Guid appointmentId,
        Guid cancelledByCollaboratorId,
        Guid? requesterProfessionalId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var appointment = await appointmentStore.FindByIdAsync(appointmentId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Agendamento nao encontrado.", 404));

        if (appointment.Status != AppointmentStatus.Scheduled)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentNotScheduled,
                "Apenas agendamentos com status 'Scheduled' podem ser cancelados.", 422));
        }

        if (!isAdmin && requesterProfessionalId.HasValue && appointment.ProfessionalId != requesterProfessionalId.Value)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Forbidden, "Profissional nao pode cancelar agendamentos de outros profissionais.", 403));
        }

        var salon = await dataStore.GetSalonAsync(tenantId, cancellationToken);
        var noticeMinutes = salon?.MinimumCancellationNoticeMinutes ?? 0;
        var minutesUntilStart = (appointment.StartAtUtc - DateTimeOffset.UtcNow).TotalMinutes;
        var isLate = noticeMinutes > 0 && minutesUntilStart < noticeMinutes;

        if (!isAdmin && isLate)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.CancellationWindowExpired,
                $"O cancelamento deve ser feito com pelo menos {noticeMinutes} minutos de antecedencia.", 422));
        }

        var historyEventType = isLate ? ClientHistoryEventType.LateCancelled : ClientHistoryEventType.Cancelled;

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await appointmentStore.UpdateAsync(appointment, null, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = appointment.ClientId,
            AppointmentId = appointment.Id,
            Type = historyEventType,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = isLate ? "Cancelamento tardio." : "Agendamento cancelado.",
            CreatedByCollaboratorId = cancelledByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
