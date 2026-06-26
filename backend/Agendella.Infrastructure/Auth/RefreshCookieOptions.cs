namespace Agendella.Infrastructure.Auth;

public sealed class RefreshCookieOptions
{
    public const string SectionName = "RefreshCookie";

    public string Name { get; init; } = string.Empty;

    public string Domain { get; init; } = string.Empty;

    public string Path { get; init; } = "/auth";

    public bool Secure { get; init; }

    public string SameSite { get; init; } = "Strict";

    public bool HttpOnly { get; init; } = true;

    public int DurationDays { get; init; }
}
