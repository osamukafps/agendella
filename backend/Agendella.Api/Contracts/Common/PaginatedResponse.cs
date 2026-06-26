namespace Agendella.Api.Contracts.Common;

public sealed record PaginatedResponse<TItem>(
    IReadOnlyList<TItem> Items,
    string? NextCursor);
