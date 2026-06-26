using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Agendella.Infrastructure.Persistence;

public sealed class DesignTimeAgendellaDbContextFactory : IDesignTimeDbContextFactory<AgendellaDbContext>
{
    public AgendellaDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AgendellaDbContext>();

        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=agendella_dev;Username=agendella;Password=agendella");

        return new AgendellaDbContext(optionsBuilder.Options);
    }
}
