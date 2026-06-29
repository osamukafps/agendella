using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class SalonBlockConfiguration : IEntityTypeConfiguration<SalonBlock>
{
    public void Configure(EntityTypeBuilder<SalonBlock> builder)
    {
        builder.ToTable("SalonBlocks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.StartAtUtc).IsRequired();
        builder.Property(x => x.EndAtUtc).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(1000);
        builder.Property(x => x.CreatedByCollaboratorId).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.SalonBlocks)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CreatedByCollaborator)
            .WithMany()
            .HasForeignKey(x => x.CreatedByCollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
