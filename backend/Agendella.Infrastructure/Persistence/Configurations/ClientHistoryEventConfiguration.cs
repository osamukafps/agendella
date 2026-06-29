using Agendella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agendella.Infrastructure.Persistence.Configurations;

public sealed class ClientHistoryEventConfiguration : IEntityTypeConfiguration<ClientHistoryEvent>
{
    public void Configure(EntityTypeBuilder<ClientHistoryEvent> builder)
    {
        builder.ToTable("ClientHistoryEvents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired();
        builder.Property(x => x.ClientId).IsRequired();
        builder.Property(x => x.Type).HasConversion<string>().IsRequired();
        builder.Property(x => x.OccurredAtUtc).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.CreatedByCollaboratorId).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.ClientHistoryEvents)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Client)
            .WithMany(x => x.HistoryEvents)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Appointment)
            .WithMany(x => x.HistoryEvents)
            .HasForeignKey(x => x.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.CreatedByCollaborator)
            .WithMany()
            .HasForeignKey(x => x.CreatedByCollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
