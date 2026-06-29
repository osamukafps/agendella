using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Clients;

public sealed class ClientManagementService(ITenantContext tenantContext, IClientStore store)
{
    public async Task<(IReadOnlyList<Client> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        return await store.ListAsync(pageSize, cursor, cancellationToken);
    }

    public async Task<Client> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await store.FindByIdAsync(id, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Cliente nao encontrado.", 404));
    }

    public async Task<Client> CreateAsync(
        string name,
        string phone,
        string email,
        string notes,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        await EnsurePhoneUniqueAsync(tenantId, phone, null, cancellationToken);

        var client = new Client
        {
            TenantId = tenantId,
            Name = name,
            Phone = phone,
            Email = email,
            Notes = notes,
            Status = RecordStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await store.AddAsync(client, cancellationToken);
        await store.SaveChangesAsync(cancellationToken);
        return client;
    }

    public async Task<Client> UpdateAsync(
        Guid id,
        string name,
        string phone,
        string email,
        string notes,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        var client = await GetAsync(id, cancellationToken);

        if (client.Phone != phone)
        {
            await EnsurePhoneUniqueAsync(tenantId, phone, id, cancellationToken);
        }

        client.Name = name;
        client.Phone = phone;
        client.Email = email;
        client.Notes = notes;
        client.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await store.SaveChangesAsync(cancellationToken);
        return client;
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var client = await GetAsync(id, cancellationToken);
        client.Status = RecordStatus.Inactive;
        client.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await store.SaveChangesAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<ClientHistoryEvent> Items, string? NextCursor)> GetHistoryAsync(
        Guid clientId,
        Guid? requesterProfessionalId,
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        await GetAsync(clientId, cancellationToken);
        return await store.GetHistoryAsync(clientId, requesterProfessionalId, pageSize, cursor, cancellationToken);
    }

    private async Task EnsurePhoneUniqueAsync(Guid tenantId, string phone, Guid? excludeClientId, CancellationToken cancellationToken)
    {
        var exists = await store.PhoneExistsAsync(tenantId, phone, excludeClientId, cancellationToken);
        if (exists)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ClientPhoneDuplicate,
                "Ja existe um cliente com esse telefone nesse salao.",
                409));
        }
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
