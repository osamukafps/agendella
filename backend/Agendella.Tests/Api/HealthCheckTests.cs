using System.Net;
using Agendella.Tests.Infrastructure;

namespace Agendella.Tests.Api;

public sealed class HealthCheckTests : IClassFixture<BackendTestApplicationFactory>
{
    private readonly BackendTestApplicationFactory _factory;

    public HealthCheckTests(BackendTestApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthEndpoints_ShouldReportApiAndDatabaseReadiness()
    {
        using var client = _factory.CreateClient();

        var liveness = await client.GetAsync("/healthz");
        var readiness = await client.GetAsync("/healthz/ready");

        Assert.Equal(HttpStatusCode.OK, liveness.StatusCode);
        Assert.Equal(HttpStatusCode.OK, readiness.StatusCode);
    }
}
