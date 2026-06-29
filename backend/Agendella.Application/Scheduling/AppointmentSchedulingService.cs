using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Domain.Scheduling;

namespace Agendella.Application.Scheduling;

public sealed class AppointmentSchedulingService(
    ITenantContext tenantContext,
    ISchedulingDataStore dataStore,
    IAppointmentStore appointmentStore)
{
    public async Task<Appointment> CreateAsync(
        Guid clientId,
        Guid professionalId,
        Guid serviceId,
        DateTimeOffset startAtUtc,
        DateTimeOffset? manualEndAtUtc,
        Guid createdByCollaboratorId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var (service, professional, client, salon) = await ValidateActiveReferencesAsync(
            tenantId, clientId, professionalId, serviceId, cancellationToken);

        var endAtUtc = AppointmentWindow.ComputeEnd(startAtUtc, service.DurationMinutes, manualEndAtUtc);

        if (endAtUtc <= startAtUtc)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ValidationFailed, "O fim do agendamento deve ser posterior ao inicio.", 400));
        }

        var conflict = await EvaluateConflictAsync(tenantId, professionalId, startAtUtc, endAtUtc, null, salon, cancellationToken);

        var appointment = new Appointment
        {
            TenantId = tenantId,
            ClientId = clientId,
            ProfessionalId = professionalId,
            ServiceId = serviceId,
            StartAtUtc = startAtUtc,
            EndAtUtc = endAtUtc,
            Status = AppointmentStatus.Scheduled,
            CreatedByCollaboratorId = createdByCollaboratorId,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await appointmentStore.CreateAsync(appointment, conflict, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = clientId,
            AppointmentId = appointment.Id,
            Type = ClientHistoryEventType.AppointmentCreated,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = $"Agendamento criado para {startAtUtc:dd/MM/yyyy HH:mm} UTC.",
            CreatedByCollaboratorId = createdByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
        return appointment;
    }

    public async Task<Appointment> RescheduleAsync(
        Guid appointmentId,
        DateTimeOffset newStartAtUtc,
        DateTimeOffset? newManualEndAtUtc,
        Guid updatedByCollaboratorId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var appointment = await appointmentStore.FindByIdAsync(appointmentId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Agendamento nao encontrado.", 404));

        if (appointment.Status != AppointmentStatus.Scheduled)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentNotScheduled, "Apenas agendamentos com status 'Scheduled' podem ser reagendados.", 422));
        }

        EnforceAppointmentAccess(appointment, requesterProfessionalId);

        var salon = await dataStore.GetSalonAsync(tenantId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Salao nao encontrado.", 404));

        var service = await dataStore.GetServiceAsync(appointment.ServiceId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Servico nao encontrado.", 404));

        var newEndAtUtc = AppointmentWindow.ComputeEnd(newStartAtUtc, service.DurationMinutes, newManualEndAtUtc);

        if (newEndAtUtc <= newStartAtUtc)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ValidationFailed, "O fim do agendamento deve ser posterior ao inicio.", 400));
        }

        var conflict = await EvaluateConflictAsync(tenantId, appointment.ProfessionalId, newStartAtUtc, newEndAtUtc, appointmentId, salon, cancellationToken);

        appointment.StartAtUtc = newStartAtUtc;
        appointment.EndAtUtc = newEndAtUtc;
        appointment.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await appointmentStore.UpdateAsync(appointment, conflict, cancellationToken);

        await appointmentStore.AddHistoryEventAsync(new ClientHistoryEvent
        {
            TenantId = tenantId,
            ClientId = appointment.ClientId,
            AppointmentId = appointment.Id,
            Type = ClientHistoryEventType.Rescheduled,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Description = $"Reagendado para {newStartAtUtc:dd/MM/yyyy HH:mm} UTC.",
            CreatedByCollaboratorId = updatedByCollaboratorId
        }, cancellationToken);

        await appointmentStore.SaveChangesAsync(cancellationToken);
        return appointment;
    }

    private async Task<(Domain.Entities.Service, Professional, Client, Domain.Entities.SalonTenant)> ValidateActiveReferencesAsync(
        Guid tenantId, Guid clientId, Guid professionalId, Guid serviceId, CancellationToken cancellationToken)
    {
        var service = await dataStore.GetServiceAsync(serviceId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Servico nao encontrado.", 404));

        if (service.Status != RecordStatus.Active)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentServiceInactive, "O servico informado esta inativo.", 422));
        }

        var professional = await dataStore.GetProfessionalAsync(professionalId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Profissional nao encontrado.", 404));

        if (professional.Status != RecordStatus.Active)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentProfessionalInactive, "O profissional informado esta inativo.", 422));
        }

        var client = await dataStore.GetClientAsync(clientId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Cliente nao encontrado.", 404));

        if (client.Status != RecordStatus.Active)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.AppointmentClientInactive, "O cliente informado esta inativo.", 422));
        }

        var salon = await dataStore.GetSalonAsync(tenantId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(ErrorCodes.ResourceNotFound, "Salao nao encontrado.", 404));

        return (service, professional, client, salon);
    }

    private async Task<AppointmentConflictError?> EvaluateConflictAsync(
        Guid tenantId,
        Guid professionalId,
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        Guid? excludeAppointmentId,
        Domain.Entities.SalonTenant salon,
        CancellationToken cancellationToken)
    {
        var businessHours = await dataStore.GetBusinessHoursAsync(tenantId, cancellationToken);
        var profAvailability = await dataStore.GetProfessionalAvailabilityAsync(professionalId, cancellationToken);
        var blocks = await dataStore.GetSalonBlocksInWindowAsync(tenantId, startAtUtc, endAtUtc, cancellationToken);
        var absences = await dataStore.GetActiveAbsencesInWindowAsync(professionalId, startAtUtc, endAtUtc, cancellationToken);
        var appointments = await dataStore.GetScheduledAppointmentsInWindowAsync(professionalId, startAtUtc, endAtUtc, excludeAppointmentId, cancellationToken);

        var conflict = AvailabilityEvaluator.Evaluate(
            startAtUtc, endAtUtc,
            salon.TimeZoneId,
            businessHours, profAvailability,
            blocks, absences, appointments,
            excludeAppointmentId);

        if (conflict is null) return null;

        return new AppointmentConflictError(
            conflict.Type, conflict.BlockStart, conflict.BlockEnd,
            conflict.ResourceId, conflict.ResourceName);
    }

    private static void EnforceAppointmentAccess(Appointment appointment, Guid? requesterProfessionalId)
    {
        if (requesterProfessionalId.HasValue && appointment.ProfessionalId != requesterProfessionalId.Value)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Forbidden,
                "Profissional nao pode operar agendamentos de outros profissionais.",
                403));
        }
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
