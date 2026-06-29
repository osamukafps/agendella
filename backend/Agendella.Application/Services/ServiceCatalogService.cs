using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Enums;
using ServiceEntity = Agendella.Domain.Entities.Service;

namespace Agendella.Application.Services;

public sealed class ServiceCatalogService(ITenantContext tenantContext, IServiceCatalogStore store)
{
    public async Task<(IReadOnlyList<ServiceEntity> Items, string? NextCursor)> ListAsync(
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken = default)
    {
        RequireTenantId();
        return await store.ListAsync(pageSize, cursor, cancellationToken);
    }

    public async Task<ServiceEntity> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await store.FindByIdAsync(id, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Servico nao encontrado.", 404));
    }

    public async Task<ServiceEntity> CreateAsync(
        string name,
        string description,
        int durationMinutes,
        decimal priceAmount,
        string currency,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();

        var service = new ServiceEntity
        {
            TenantId = tenantId,
            Name = name,
            Description = description,
            DurationMinutes = durationMinutes,
            PriceAmount = priceAmount,
            Currency = currency,
            Status = RecordStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        await store.AddAsync(service, cancellationToken);
        await store.SaveChangesAsync(cancellationToken);
        return service;
    }

    public async Task<ServiceEntity> UpdateAsync(
        Guid id,
        string name,
        string description,
        int durationMinutes,
        decimal priceAmount,
        string currency,
        CancellationToken cancellationToken = default)
    {
        var service = await GetAsync(id, cancellationToken);

        service.Name = name;
        service.Description = description;
        service.DurationMinutes = durationMinutes;
        service.PriceAmount = priceAmount;
        service.Currency = currency;
        service.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await store.SaveChangesAsync(cancellationToken);
        return service;
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await GetAsync(id, cancellationToken);
        service.Status = RecordStatus.Inactive;
        service.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await store.SaveChangesAsync(cancellationToken);
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
