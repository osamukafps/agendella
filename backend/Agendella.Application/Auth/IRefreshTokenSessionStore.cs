using Agendella.Domain.Entities;

namespace Agendella.Application.Auth;

public interface IRefreshTokenSessionStore
{
    Task AddAsync(RefreshTokenSession session, CancellationToken cancellationToken = default);

    Task<RefreshTokenSession?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    Task RevokeFamilyAsync(Guid familyId, DateTimeOffset revokedAtUtc, CancellationToken cancellationToken = default);
}
