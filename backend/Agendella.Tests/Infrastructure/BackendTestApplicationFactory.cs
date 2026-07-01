using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Agendella.Tests.Infrastructure;

public sealed class BackendTestApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("AGENDLLA_PILOT_ADMIN_PASSWORD", "agendella123");

        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:LoginPerIpPerMinute"] = "2",
                ["RateLimiting:LoginPerIpAndEmailPerHour"] = "2",
                ["RateLimiting:RefreshPerIpPerMinute"] = "2",
                ["RateLimiting:AuthenticatedPerCollaboratorPerMinute"] = "2"
            });
        });
    }
}
