namespace Agendella.Api.Contracts.Common;

public record ErrorResponse(
    string Code,
    string Message,
    IReadOnlyDictionary<string, object?>? Details = null);
