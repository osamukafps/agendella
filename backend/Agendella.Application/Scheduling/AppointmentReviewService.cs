using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Scheduling;

public sealed class AppointmentReviewService(
    ITenantContext tenantContext,
    IAppointmentStore appointmentStore)
{
    public async Task ResolveReviewAsync(
        Guid appointmentId,
        Guid resolvedByCollaboratorId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var appointment = await appointmentStore.FindByIdAsync(appointmentId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Agendamento nao encontrado.", 404));

        if (!appointment.RequiresReview)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentReviewNotRequired,
                "Este agendamento nao requer revisao.", 422));
        }

        appointment.RequiresReview = false;
        appointment.ReviewReason = null;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await appointmentStore.UpdateAsync(appointment, null, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = appointment.ClientId,
            AppointmentId = appointment.Id,
            Type = ClientHistoryEventType.ReviewResolved,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = "Revisao resolvida pelo operador.",
            CreatedByCollaboratorId = resolvedByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
