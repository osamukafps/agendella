using Agendella.Domain.Entities;

namespace Agendella.Application.Auth;

public interface IPasswordHasher
{
    string HashPassword(SalonCollaborator collaborator, string password);

    bool VerifyHashedPassword(SalonCollaborator collaborator, string hashedPassword, string providedPassword);
}
