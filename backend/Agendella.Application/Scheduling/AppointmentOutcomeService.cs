using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Scheduling;

public sealed class AppointmentOutcomeService(
    ITenantContext tenantContext,
    IAppointmentStore appointmentStore)
{
    public async Task CompleteAsync(
        Guid appointmentId,
        Guid updatedByCollaboratorId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await GetScheduledAppointmentAsync(appointmentId, requesterProfessionalId, cancellationToken);
        var tenantId = RequireTenantId();

        appointment.Status = AppointmentStatus.Completed;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await appointmentStore.UpdateAsync(appointment, null, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = appointment.ClientId,
            AppointmentId = appointment.Id,
            Type = ClientHistoryEventType.Completed,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = "Atendimento concluido.",
            CreatedByCollaboratorId = updatedByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkNoShowAsync(
        Guid appointmentId,
        Guid updatedByCollaboratorId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await GetScheduledAppointmentAsync(appointmentId, requesterProfessionalId, cancellationToken);
        var tenantId = RequireTenantId();

        appointment.Status = AppointmentStatus.NoShow;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await appointmentStore.UpdateAsync(appointment, null, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = appointment.ClientId,
            AppointmentId = appointment.Id,
            Type = ClientHistoryEventType.NoShow,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = "Cliente nao compareceu.",
            CreatedByCollaboratorId = updatedByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
    }

    private async Task<Domain.Entities.Appointment> GetScheduledAppointmentAsync(
        Guid appointmentId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken)
    {
        var appointment = await appointmentStore.FindByIdAsync(appointmentId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Agendamento nao encontrado.", 404));

        if (appointment.Status != AppointmentStatus.Scheduled)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentNotScheduled,
                "Apenas agendamentos 'Scheduled' podem ter seu resultado registrado.", 422));
        }

        if (requesterProfessionalId.HasValue && appointment.ProfessionalId != requesterProfessionalId.Value)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Forbidden, "Profissional nao pode operar agendamentos de outros profissionais.", 403));
        }

        return appointment;
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
