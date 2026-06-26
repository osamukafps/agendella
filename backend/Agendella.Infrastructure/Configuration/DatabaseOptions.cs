namespace Agendella.Infrastructure.Configuration;

public sealed class DatabaseOptions
{
    public const string SectionName = "ConnectionStrings";

    public string Postgres { get; init; } = string.Empty;
}
