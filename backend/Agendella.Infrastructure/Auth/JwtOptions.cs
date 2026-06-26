namespace Agendella.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = string.Empty;

    public string Audience { get; init; } = string.Empty;

    public int AccessTokenMinutes { get; init; }

    public string PrivateKeyPath { get; init; } = string.Empty;

    public string PublicKeyPath { get; init; } = string.Empty;
}
