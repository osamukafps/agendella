using System.Security.Cryptography;
using System.Text;
using Agendella.Application.Common.Errors;
using Agendella.Domain.Entities;

namespace Agendella.Application.Auth;

public sealed class RefreshTokenService(IRefreshTokenSessionStore repository)
{
    public async Task<(RefreshTokenSession Session, string PlainTextToken)> CreateSessionAsync(SalonCollaborator collaborator, CancellationToken cancellationToken = default)
    {
        var plainTextToken = CreateOpaqueToken();
        var session = new RefreshTokenSession
        {
            TenantId = collaborator.TenantId,
            CollaboratorId = collaborator.Id,
            TokenHash = ComputeHash(plainTextToken),
            FamilyId = Guid.NewGuid(),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(14),
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UserAgent = string.Empty,
            IpAddress = string.Empty,
            Collaborator = collaborator
        };

        await repository.AddAsync(session, cancellationToken);
        return (session, plainTextToken);
    }

    public async Task<(RefreshTokenSession Session, string PlainTextToken)> RotateAsync(string plainTextToken, CancellationToken cancellationToken = default)
    {
        var tokenHash = ComputeHash(plainTextToken);
        var existingSession = await repository.FindByHashAsync(tokenHash, cancellationToken);

        if (existingSession is null || existingSession.Collaborator is null || existingSession.ExpiresAtUtc <= DateTimeOffset.UtcNow || existingSession.RevokedAtUtc.HasValue)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.RefreshTokenInvalid,
                "O refresh token informado e invalido ou expirou.",
                401));
        }

        if (existingSession.RotatedAtUtc.HasValue)
        {
            await repository.RevokeFamilyAsync(existingSession.FamilyId, DateTimeOffset.UtcNow, cancellationToken);
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.RefreshTokenInvalid,
                "O refresh token informado ja foi reutilizado.",
                401));
        }

        existingSession.RotatedAtUtc = DateTimeOffset.UtcNow;

        var newToken = CreateOpaqueToken();
        var replacement = new RefreshTokenSession
        {
            TenantId = existingSession.TenantId,
            CollaboratorId = existingSession.CollaboratorId,
            TokenHash = ComputeHash(newToken),
            FamilyId = existingSession.FamilyId,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(14),
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UserAgent = existingSession.UserAgent,
            IpAddress = existingSession.IpAddress,
            Collaborator = existingSession.Collaborator
        };

        existingSession.ReplacedByTokenId = replacement.Id;

        await repository.AddAsync(replacement, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return (replacement, newToken);
    }

    public async Task RevokeAsync(string plainTextToken, CancellationToken cancellationToken = default)
    {
        var session = await repository.FindByHashAsync(ComputeHash(plainTextToken), cancellationToken);

        if (session is null)
        {
            return;
        }

        session.RevokedAtUtc = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
    }

    private static string CreateOpaqueToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string ComputeHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
