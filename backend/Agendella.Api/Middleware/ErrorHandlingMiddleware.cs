using Agendella.Application.Common.Errors;

namespace Agendella.Api.Middleware;

public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApplicationRuleException exception)
        {
            logger.LogWarning(exception, "Application error {ErrorCode}", exception.Error.Code);
            await WriteErrorAsync(context, exception.Error);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception while processing request");

            var error = new ApplicationError(
                ErrorCodes.Unexpected,
                "Ocorreu um erro inesperado ao processar a requisicao.",
                StatusCodes.Status500InternalServerError);

            await WriteErrorAsync(context, error);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, ApplicationError error)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = error.StatusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            code = error.Code,
            message = error.Message,
            details = error.Details
        });
    }
}
