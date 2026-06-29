using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class SalonBusinessHourConfiguration : IEntityTypeConfiguration<SalonBusinessHour>
{
    public void Configure(EntityTypeBuilder<SalonBusinessHour> builder)
    {
        builder.ToTable("SalonBusinessHours");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.DayOfWeek).IsRequired();
        builder.Property(x => x.IsClosed).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.BusinessHours)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TenantId, x.DayOfWeek }).IsUnique();
    }
}
