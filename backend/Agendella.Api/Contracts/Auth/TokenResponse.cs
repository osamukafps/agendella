namespace Agendella.Api.Contracts.Auth;

public sealed record TokenResponse(string AccessToken, DateTimeOffset ExpiresAtUtc);
