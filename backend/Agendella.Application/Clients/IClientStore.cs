using Agendella.Domain.Entities;

namespace Agendella.Application.Clients;

public interface IClientStore
{
    Task<Client?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Client> Items, string? NextCursor)> ListAsync(int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task AddAsync(Client client, CancellationToken cancellationToken = default);
    Task<bool> PhoneExistsAsync(Guid tenantId, string phone, Guid? excludeClientId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<ClientHistoryEvent> Items, string? NextCursor)> GetHistoryAsync(Guid clientId, Guid? requesterProfessionalId, int pageSize, string? cursor, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
