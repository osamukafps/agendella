using ServiceEntity = Agendella.Domain.Entities.Service;

namespace Agendella.Application.Services;

public interface IServiceCatalogStore
{
    Task<ServiceEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<ServiceEntity> Items, string? NextCursor)> ListAsync(int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task AddAsync(ServiceEntity service, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
