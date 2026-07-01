using Agendella.Api.Configuration;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Agendella.Tests.Api;

public sealed class CorsPolicyTests
{
    [Fact]
    public async Task CorsPolicy_ShouldAllowConfiguredOriginWithCredentials_AndRejectUnknownOrigin()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:4200"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddOptions();
        services.AddConfiguredCors(configuration);

        await using var provider = services.BuildServiceProvider();
        var corsService = provider.GetRequiredService<ICorsService>();
        var corsPolicyProvider = provider.GetRequiredService<ICorsPolicyProvider>();

        var allowedContext = new DefaultHttpContext();
        allowedContext.Request.Headers.Origin = "http://localhost:4200";
        allowedContext.Request.Method = HttpMethods.Post;

        var policy = await corsPolicyProvider.GetPolicyAsync(allowedContext, CorsConfiguration.PolicyName);
        var allowedResult = corsService.EvaluatePolicy(allowedContext, policy!);

        Assert.True(allowedResult.IsOriginAllowed);
        Assert.True(allowedResult.SupportsCredentials);

        var deniedContext = new DefaultHttpContext();
        deniedContext.Request.Headers.Origin = "https://malicious.example.com";
        deniedContext.Request.Method = HttpMethods.Post;

        var deniedResult = corsService.EvaluatePolicy(deniedContext, policy!);
        Assert.False(deniedResult.IsOriginAllowed);
    }
}
