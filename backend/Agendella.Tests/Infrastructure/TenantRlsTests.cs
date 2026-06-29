using Agendella.Domain.Enums;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Agendella.Tests.Infrastructure;

public sealed class TenantRlsTests(PostgresTestFixture fixture) : IClassFixture<PostgresTestFixture>
{
    [Fact]
    public async Task Rls_ShouldBlockRowsFromOtherTenants_WhenQueryingDirectSql()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        await using (var context = new AgendellaDbContext(options))
        {
            await context.Database.MigrateAsync();
        }

        await using var scope = await fixture.BeginTransactionScopeAsync();
        var connection = (NpgsqlConnection)scope.Connection;

        await EnsureClientRlsAsync(connection);

        await InsertTenantAsync(connection, tenantA, "Tenant A");
        await InsertTenantAsync(connection, tenantB, "Tenant B");
        await InsertClientAsync(connection, tenantA, "Cliente A", "111");
        await InsertClientAsync(connection, tenantB, "Cliente B", "222");

        await EnsureRestrictedRoleAsync(connection);

        await SetTenantAsync(connection, tenantA);

        await using var setRoleCommand = connection.CreateCommand();
        setRoleCommand.CommandText = "set role agendella_rls_subject;";
        await setRoleCommand.ExecuteNonQueryAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = "select count(*) from \"Clients\";";

        var count = (long)(await command.ExecuteScalarAsync())!;

        await using var resetRoleCommand = connection.CreateCommand();
        resetRoleCommand.CommandText = "reset role;";
        await resetRoleCommand.ExecuteNonQueryAsync();

        Assert.Equal(1, count);
    }

    private static async Task EnsureClientRlsAsync(NpgsqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            alter table "Clients" enable row level security;
            alter table "Clients" force row level security;
            drop policy if exists "Clients_tenant_policy" on "Clients";
            create policy "Clients_tenant_policy" on "Clients"
            using ("TenantId"::text = current_setting('app.tenant_id', true))
            with check ("TenantId"::text = current_setting('app.tenant_id', true));
            """;

        await command.ExecuteNonQueryAsync();
    }

    private static async Task EnsureRestrictedRoleAsync(NpgsqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            do $$
            begin
                if not exists (select 1 from pg_roles where rolname = 'agendella_rls_subject') then
                    create role agendella_rls_subject noinherit;
                end if;
            end
            $$;
            grant agendella_rls_subject to current_user;
            grant usage on schema public to agendella_rls_subject;
            grant select on "Clients" to agendella_rls_subject;
            """;

        await command.ExecuteNonQueryAsync();
    }

    private static async Task InsertTenantAsync(NpgsqlConnection connection, Guid tenantId, string name)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "insert into \"SalonTenants\" (\"Id\", \"Name\", \"Address\", \"Phone\", \"TimeZoneId\", \"Status\", \"MinimumCancellationNoticeMinutes\", \"CreatedAtUtc\", \"UpdatedAtUtc\") values (@id, @name, '', '', 'America/Sao_Paulo', @status, 0, now(), now()) on conflict do nothing;";
        command.Parameters.AddWithValue("id", tenantId);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("status", SalonStatus.Active.ToString());
        await command.ExecuteNonQueryAsync();
    }

    private static async Task InsertClientAsync(NpgsqlConnection connection, Guid tenantId, string name, string phone)
    {
        await SetTenantAsync(connection, tenantId);

        await using var command = connection.CreateCommand();
        command.CommandText = "insert into \"Clients\" (\"Id\", \"TenantId\", \"Name\", \"Phone\", \"Email\", \"Notes\", \"Status\", \"CreatedAtUtc\", \"UpdatedAtUtc\") values (@id, @tenantId, @name, @phone, '', '', @status, now(), now());";
        command.Parameters.AddWithValue("id", Guid.NewGuid());
        command.Parameters.AddWithValue("tenantId", tenantId);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("phone", phone);
        command.Parameters.AddWithValue("status", RecordStatus.Active.ToString());
        await command.ExecuteNonQueryAsync();
    }

    private static async Task SetTenantAsync(NpgsqlConnection connection, Guid tenantId)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "select set_config('app.tenant_id', @tenantId, false);";
        command.Parameters.AddWithValue("tenantId", tenantId.ToString());
        await command.ExecuteNonQueryAsync();
    }
}
