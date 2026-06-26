namespace Agendella.Application.Common.Errors;

public sealed record ApplicationError(
    string Code,
    string Message,
    int StatusCode,
    IReadOnlyDictionary<string, object?>? Details = null);

public sealed class ApplicationRuleException : Exception
{
    public ApplicationRuleException(ApplicationError error)
        : base(error.Message)
    {
        Error = error;
    }

    public ApplicationError Error { get; }
}
