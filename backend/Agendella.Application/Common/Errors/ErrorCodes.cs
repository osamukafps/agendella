namespace Agendella.Application.Common.Errors;

public static class ErrorCodes
{
    public const string Unexpected = "unexpected.error";

    public const string ValidationFailed = "validation.failed";

    public const string ResourceNotFound = "resource.not_found";

    public const string Forbidden = "authorization.forbidden";

    public const string Unauthorized = "authorization.unauthorized";

    public const string Conflict = "resource.conflict";
}
