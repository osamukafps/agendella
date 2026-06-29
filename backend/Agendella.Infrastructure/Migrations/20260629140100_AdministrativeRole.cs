using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agendella.Infrastructure.Migrations;

[DbContext(typeof(Persistence.AgendellaDbContext))]
[Migration("20260629140100_AdministrativeRole")]
public partial class AdministrativeRole : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agendella_admin') THEN CREATE ROLE agendella_admin NOLOGIN BYPASSRLS; END IF; END $$;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agendella_admin') THEN DROP ROLE agendella_admin; END IF; END $$;");
    }
}
