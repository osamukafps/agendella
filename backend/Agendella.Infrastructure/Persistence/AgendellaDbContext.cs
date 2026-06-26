using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Persistence;

public class AgendellaDbContext(DbContextOptions<AgendellaDbContext> options) : DbContext(options)
{
}
