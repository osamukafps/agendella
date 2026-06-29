using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;

namespace Agendella.Application.Scheduling;

public sealed class SalonBlockService(ITenantContext tenantContext, ISalonBlockStore store)
{
    public async Task<(IReadOnlyList<SalonBlock> Items, string? NextCursor)> ListAsync(
        int pageSize, string? cursor, CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        return await store.ListAsync(pageSize, cursor, cancellationToken);
    }

    public async Task<SalonBlock> CreateAsync(
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        string reason,
        Guid createdByCollaboratorId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        if (endAtUtc <= startAtUtc)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ValidationFailed, "O fim do bloco deve ser posterior ao inicio.", 400));
        }

        var block = new SalonBlock
        {
            TenantId = tenantId,
            StartAtUtc = startAtUtc,
            EndAtUtc = endAtUtc,
            Reason = reason,
            CreatedByCollaboratorId = createdByCollaboratorId,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await store.AddAsync(block, cancellationToken);

        var affected = await store.GetScheduledAppointmentsOverlappingAsync(tenantId, startAtUtc, endAtUtc, cancellationToken);
        if (affected.Count > 0)
        {
            await store.MarkRequiresReviewAsync(affected, $"Bloco de salao criado: {reason}", cancellationToken);
        }

        await store.SaveChangesAsync(cancellationToken);
        return block;
    }

    public async Task DeleteAsync(Guid blockId, CancellationToken cancellationToken = default)
    {
        RequireTenantId();

        var block = await store.FindByIdAsync(blockId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Bloco nao encontrado.", 404));

        await store.DeleteAsync(block, cancellationToken);
        await store.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
