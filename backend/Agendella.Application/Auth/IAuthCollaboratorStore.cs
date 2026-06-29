using Agendella.Domain.Entities;

namespace Agendella.Application.Auth;

public interface IAuthCollaboratorStore
{
    Task<SalonCollaborator?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
}
