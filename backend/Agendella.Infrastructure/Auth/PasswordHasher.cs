using Agendella.Application.Auth;
using Agendella.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Agendella.Infrastructure.Auth;

public sealed class PasswordHasher : IPasswordHasher
{
    private readonly Microsoft.AspNetCore.Identity.IPasswordHasher<SalonCollaborator> _passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<SalonCollaborator>();

    public string HashPassword(SalonCollaborator collaborator, string password)
        => _passwordHasher.HashPassword(collaborator, password);

    public bool VerifyHashedPassword(SalonCollaborator collaborator, string hashedPassword, string providedPassword)
        => _passwordHasher.VerifyHashedPassword(collaborator, hashedPassword, providedPassword) is not PasswordVerificationResult.Failed;
}
