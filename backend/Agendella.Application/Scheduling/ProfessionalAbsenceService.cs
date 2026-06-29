using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Scheduling;

public sealed class ProfessionalAbsenceService(ITenantContext tenantContext, IProfessionalAbsenceStore store)
{
    public async Task<(IReadOnlyList<ProfessionalAbsence> Items, string? NextCursor)> ListAsync(
        Guid professionalId,
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        return await store.ListAsync(professionalId, pageSize, cursor, cancellationToken);
    }

    public async Task<ProfessionalAbsence> CreateAsync(
        Guid professionalId,
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        string reason,
        Guid createdByCollaboratorId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        EnforceProfessionalAccess(professionalId, requesterProfessionalId);

        var professional = await store.GetProfessionalAsync(professionalId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Profissional nao encontrado.", 404));

        if (endAtUtc <= startAtUtc)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ValidationFailed, "O fim da ausencia deve ser posterior ao inicio.", 400));
        }

        var absence = new ProfessionalAbsence
        {
            TenantId = tenantId,
            ProfessionalId = professionalId,
            StartAtUtc = startAtUtc,
            EndAtUtc = endAtUtc,
            Reason = reason,
            Status = RecordStatus.Active,
            CreatedByCollaboratorId = createdByCollaboratorId,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await store.AddAsync(absence, cancellationToken);

        var affected = await store.GetScheduledAppointmentsOverlappingAsync(professionalId, startAtUtc, endAtUtc, cancellationToken);
        if (affected.Count > 0)
        {
            await store.MarkRequiresReviewAsync(affected, $"Ausencia criada: {reason}", cancellationToken);
        }

        await store.SaveChangesAsync(cancellationToken);
        return absence;
    }

    public async Task CancelAsync(
        Guid professionalId,
        Guid absenceId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();

        EnforceProfessionalAccess(professionalId, requesterProfessionalId);

        var absence = await store.FindByIdAsync(absenceId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Ausencia nao encontrada.", 404));

        if (absence.ProfessionalId != professionalId)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Ausencia nao encontrada.", 404));
        }

        if (absence.Status != RecordStatus.Active)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Conflict, "A ausencia ja foi cancelada.", 409));
        }

        absence.Status = RecordStatus.Inactive;
        absence.CancelledAtUtc = DateTimeOffset.UtcNow;
        absence.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await store.SaveChangesAsync(cancellationToken);
    }

    private static void EnforceProfessionalAccess(Guid professionalId, Guid? requesterProfessionalId)
    {
        if (requesterProfessionalId.HasValue && requesterProfessionalId.Value != professionalId)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Forbidden,
                "Profissional nao pode criar ou cancelar ausencias de outro profissional.",
                403));
        }
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
