namespace Agendella.Infrastructure.Repositories;

internal static class CursorHelper
{
    internal static string? Encode(DateTimeOffset createdAt, Guid id)
    {
        var value = $"{createdAt.UtcTicks}|{id}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(value));
    }

    internal static (DateTimeOffset CreatedAt, Guid Id)? Decode(string? cursor)
    {
        if (string.IsNullOrEmpty(cursor))
        {
            return null;
        }

        try
        {
            var value = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = value.Split('|');
            if (parts.Length != 2)
            {
                return null;
            }

            var ticks = long.Parse(parts[0]);
            var id = Guid.Parse(parts[1]);
            return (new DateTimeOffset(ticks, TimeSpan.Zero), id);
        }
        catch
        {
            return null;
        }
    }
}
