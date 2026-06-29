using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenSessionConfiguration : IEntityTypeConfiguration<RefreshTokenSession>
{
    public void Configure(EntityTypeBuilder<RefreshTokenSession> builder)
    {
        builder.ToTable("RefreshTokenSessions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.CollaboratorId).IsRequired();
        builder.Property(x => x.TokenHash).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.FamilyId).IsRequired();
        builder.Property(x => x.ExpiresAtUtc).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UserAgent).HasMaxLength(500);
        builder.Property(x => x.IpAddress).HasMaxLength(100);

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Collaborator)
            .WithMany(x => x.RefreshTokenSessions)
            .HasForeignKey(x => x.CollaboratorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
