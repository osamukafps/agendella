using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class SalonTenantConfiguration : IEntityTypeConfiguration<SalonTenant>
{
    public void Configure(EntityTypeBuilder<SalonTenant> builder)
    {
        builder.ToTable("SalonTenants");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.Phone).IsRequired().HasMaxLength(30);
        builder.Property(x => x.TimeZoneId).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Status).HasConversion<string>().IsRequired();
        builder.Property(x => x.MinimumCancellationNoticeMinutes).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();
    }
}
