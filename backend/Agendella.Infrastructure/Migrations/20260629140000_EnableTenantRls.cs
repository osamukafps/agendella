using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agendella.Infrastructure.Migrations;

[DbContext(typeof(Persistence.AgendellaDbContext))]
[Migration("20260629140000_EnableTenantRls")]
public partial class EnableTenantRls : Migration
{
    private static readonly string[] TenantTables =
    [
        "SalonBusinessHours",
        "SalonCollaborators",
        "RefreshTokenSessions",
        "Professionals",
        "ProfessionalWeeklyAvailabilities",
        "Services",
        "Clients",
        "Appointments",
        "SalonBlocks",
        "ProfessionalAbsences",
        "ClientHistoryEvents"
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var table in TenantTables)
        {
            migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"CREATE POLICY \"{table}_tenant_policy\" ON \"{table}\" USING (\"TenantId\"::text = current_setting('app.tenant_id', true)) WITH CHECK (\"TenantId\"::text = current_setting('app.tenant_id', true));");
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var table in TenantTables)
        {
            migrationBuilder.Sql($"DROP POLICY IF EXISTS \"{table}_tenant_policy\" ON \"{table}\";");
            migrationBuilder.Sql($"ALTER TABLE \"{table}\" NO FORCE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
        }
    }
}
