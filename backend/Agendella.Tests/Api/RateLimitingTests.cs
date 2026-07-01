using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Agendella.Tests.Infrastructure;

namespace Agendella.Tests.Api;

public sealed class RateLimitingTests
{
    [Fact]
    public async Task Login_ShouldReturn429AfterConfiguredLimit()
    {
        await using var factory = new BackendTestApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsync("/auth/login", BuildJson("{\"email\":\"admin@agendella.local\",\"password\":\"wrong\"}"));
        await client.PostAsync("/auth/login", BuildJson("{\"email\":\"admin@agendella.local\",\"password\":\"wrong\"}"));
        var response = await client.PostAsync("/auth/login", BuildJson("{\"email\":\"admin@agendella.local\",\"password\":\"wrong\"}"));

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.True(response.Headers.Contains("Retry-After"));
    }

    [Fact]
    public async Task Refresh_ShouldReturn429AfterConfiguredLimit()
    {
        await using var factory = new BackendTestApplicationFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-CSRF-Protection", "1");

        await client.PostAsync("/auth/refresh", null);
        await client.PostAsync("/auth/refresh", null);
        var response = await client.PostAsync("/auth/refresh", null);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedEndpoint_ShouldReturn429AfterConfiguredLimit()
    {
        await using var factory = new BackendTestApplicationFactory();
        using var client = factory.CreateClient(new() { HandleCookies = true });

        var login = await client.PostAsync(
            "/auth/login",
            BuildJson("{\"email\":\"admin@agendella.local\",\"password\":\"agendella123\"}"));

        var loginJson = await login.Content.ReadAsStringAsync();
        var token = System.Text.Json.JsonDocument.Parse(loginJson).RootElement.GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        await client.GetAsync("/me");
        await client.GetAsync("/me");
        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    private static StringContent BuildJson(string payload) => new(payload, Encoding.UTF8, "application/json");
}
