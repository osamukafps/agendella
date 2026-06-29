using Agendella.Infrastructure.Auth;
using Microsoft.Extensions.Options;

namespace Agendella.Api.Auth;

public sealed class RefreshCookieWriter(IOptions<RefreshCookieOptions> options)
{
    private readonly RefreshCookieOptions _options = options.Value;

    public void Write(HttpResponse response, string refreshToken)
    {
        response.Cookies.Append(_options.Name, refreshToken, BuildCookieOptions());
    }

    public void Clear(HttpResponse response)
    {
        var cookieOptions = BuildCookieOptions();
        cookieOptions.Expires = DateTimeOffset.UnixEpoch;
        response.Cookies.Delete(_options.Name, cookieOptions);
    }

    public string? Read(HttpRequest request)
        => request.Cookies.TryGetValue(_options.Name, out var refreshToken) ? refreshToken : null;

    private CookieOptions BuildCookieOptions() => new()
    {
        Domain = _options.Domain,
        Path = _options.Path,
        HttpOnly = _options.HttpOnly,
        Secure = _options.Secure,
        SameSite = ParseSameSite(_options.SameSite),
        Expires = DateTimeOffset.UtcNow.AddDays(_options.DurationDays)
    };

    private static SameSiteMode ParseSameSite(string value) => value.ToLowerInvariant() switch
    {
        "strict" => SameSiteMode.Strict,
        "lax" => SameSiteMode.Lax,
        _ => SameSiteMode.None
    };
}
