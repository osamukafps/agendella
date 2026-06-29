using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class ProfessionalWeeklyAvailabilityConfiguration : IEntityTypeConfiguration<ProfessionalWeeklyAvailability>
{
    public void Configure(EntityTypeBuilder<ProfessionalWeeklyAvailability> builder)
    {
        builder.ToTable("ProfessionalWeeklyAvailabilities");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.ProfessionalId).IsRequired();
        builder.Property(x => x.DayOfWeek).IsRequired();
        builder.Property(x => x.StartLocalTime).IsRequired();
        builder.Property(x => x.EndLocalTime).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Professional)
            .WithMany(x => x.WeeklyAvailabilities)
            .HasForeignKey(x => x.ProfessionalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
