using Agendella.Application.Auth;
using Agendella.Domain.Entities;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Auth;

public sealed class CollaboratorCredentialStore(AgendellaDbContext dbContext) : IAuthCollaboratorStore
{
    public Task<SalonCollaborator?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
        => dbContext.SalonCollaborators
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
}
