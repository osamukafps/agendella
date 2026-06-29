using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class SalonCollaboratorConfiguration : IEntityTypeConfiguration<SalonCollaborator>
{
    public void Configure(EntityTypeBuilder<SalonCollaborator> builder)
    {
        builder.ToTable("SalonCollaborators");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.Email).IsRequired().HasMaxLength(320);
        builder.Property(x => x.PasswordHash).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Role).HasConversion<string>().IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().IsRequired();
        builder.Property(x => x.TokenVersion).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Collaborators)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Professional)
            .WithOne()
            .HasForeignKey<SalonCollaborator>(x => x.ProfessionalId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
    }
}
