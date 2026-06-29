using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Professionals;

public sealed class ProfessionalManagementService(ITenantContext tenantContext, IProfessionalStore store)
{
    public async Task<(IReadOnlyList<Professional> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        return await store.ListAsync(pageSize, cursor, cancellationToken);
    }

    public async Task<Professional> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await store.FindByIdAsync(id, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Profissional nao encontrado.", 404));
    }

    public async Task<Professional> CreateAsync(
        string name,
        string phone,
        string email,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var professional = new Professional
        {
            TenantId = tenantId,
            Name = name,
            Phone = phone,
            Email = email,
            Status = RecordStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await store.AddAsync(professional, cancellationToken);
        await store.SaveChangesAsync(cancellationToken);
        return professional;
    }

    public async Task<Professional> UpdateAsync(
        Guid id,
        string name,
        string phone,
        string email,
        CancellationToken cancellationToken = default)
    {
        var professional = await GetAsync(id, cancellationToken);

        professional.Name = name;
        professional.Phone = phone;
        professional.Email = email;
        professional.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await store.SaveChangesAsync(cancellationToken);
        return professional;
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var professional = await GetAsync(id, cancellationToken);
        professional.Status = RecordStatus.Inactive;
        professional.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await store.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
