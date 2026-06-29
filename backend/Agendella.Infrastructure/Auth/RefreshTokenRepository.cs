using Agendella.Application.Auth;
using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Auth;

public sealed class RefreshTokenRepository(AgendellaDbContext dbContext) : IRefreshTokenSessionStore
{
    public async Task AddAsync(RefreshTokenSession session, CancellationToken cancellationToken = default)
    {
        dbContext.RefreshTokenSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<RefreshTokenSession?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
        => dbContext.RefreshTokenSessions
            .IgnoreQueryFilters()
            .Include(item => item.Collaborator)
            .SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await dbContext.SaveChangesAsync(cancellationToken);

    public async Task RevokeFamilyAsync(Guid familyId, DateTimeOffset revokedAtUtc, CancellationToken cancellationToken = default)
    {
        var sessions = await dbContext.RefreshTokenSessions
            .IgnoreQueryFilters()
            .Where(item => item.FamilyId == familyId && item.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAtUtc = revokedAtUtc;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
