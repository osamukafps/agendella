using Agendella.Application.Common.Errors;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Application.Auth;

public sealed class CredentialService(IAuthCollaboratorStore collaboratorStore, IPasswordHasher passwordHasher)
{
    public async Task<SalonCollaborator> AuthenticateAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var collaborator = await collaboratorStore.FindByEmailAsync(email, cancellationToken);

        if (collaborator is null || collaborator.Status != RecordStatus.Active || !passwordHasher.VerifyHashedPassword(collaborator, collaborator.PasswordHash, password))
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.InvalidCredentials,
                "Email ou senha invalidos.",
                401));
        }

        return collaborator;
    }
}
