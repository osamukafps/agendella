using System.Reflection;
using Agendella.Application.Tenancy;
using Agendella.Domain.Common;
using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Agendella.Infrastructure.Persistence;

public class AgendellaDbContext(DbContextOptions<AgendellaDbContext> options, ITenantContext? tenantContext = null) : DbContext(options)
{
    private Guid? CurrentTenantId => tenantContext?.TenantId;

    public DbSet<SalonTenant> SalonTenants => Set<SalonTenant>();

    public DbSet<SalonBusinessHour> SalonBusinessHours => Set<SalonBusinessHour>();

    public DbSet<SalonCollaborator> SalonCollaborators => Set<SalonCollaborator>();

    public DbSet<RefreshTokenSession> RefreshTokenSessions => Set<RefreshTokenSession>();

    public DbSet<Professional> Professionals => Set<Professional>();

    public DbSet<ProfessionalWeeklyAvailability> ProfessionalWeeklyAvailabilities => Set<ProfessionalWeeklyAvailability>();

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<SalonBlock> SalonBlocks => Set<SalonBlock>();

    public DbSet<ProfessionalAbsence> ProfessionalAbsences => Set<ProfessionalAbsence>();

    public DbSet<ClientHistoryEvent> ClientHistoryEvents => Set<ClientHistoryEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AgendellaDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(type => typeof(ITenantEntity).IsAssignableFrom(type.ClrType)))
        {
            var method = typeof(AgendellaDbContext)
                .GetMethod(nameof(SetTenantQueryFilter), BindingFlags.Instance | BindingFlags.NonPublic)!
                .MakeGenericMethod(entityType.ClrType);

            method.Invoke(this, [modelBuilder]);
        }
    }

    private void SetTenantQueryFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantEntity
    {
        modelBuilder.Entity<TEntity>()
            .HasQueryFilter(entity => CurrentTenantId != null && entity.TenantId == CurrentTenantId);
    }
}
