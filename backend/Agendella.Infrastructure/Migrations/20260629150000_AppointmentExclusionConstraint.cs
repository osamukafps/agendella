using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agendella.Infrastructure.Migrations
{
    public partial class AppointmentExclusionConstraint : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Appointments""
                ADD CONSTRAINT ""ExclusionConstraint_NonOverlappingAppointments""
                EXCLUDE USING gist (
                    ""TenantId"" WITH =,
                    ""ProfessionalId"" WITH =,
                    tstzrange(""StartAtUtc"", ""EndAtUtc"", '[)') WITH &&
                )
                WHERE (""Status"" = 'Scheduled');
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Appointments"" DROP CONSTRAINT IF EXISTS ""ExclusionConstraint_NonOverlappingAppointments"";");
            migrationBuilder.Sql("DROP EXTENSION IF EXISTS btree_gist;");
        }
    }
}
