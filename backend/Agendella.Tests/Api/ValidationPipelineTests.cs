using System.Text;
using System.Text.Json;
using Agendella.Api.Middleware;
using Agendella.Api.Validation;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Agendella.Tests.Api;

public sealed class ValidationPipelineTests
{
    [Fact]
    public async Task ErrorHandlingMiddleware_ShouldReturnValidationFailedPayload()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new ErrorHandlingMiddleware(
            _ => throw new ValidationException([
                new ValidationFailure("email", "Email invalido"),
                new ValidationFailure("password", "Senha obrigatoria")
            ]),
            NullLogger<ErrorHandlingMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        var payload = await new StreamReader(context.Response.Body, Encoding.UTF8, leaveOpen: true).ReadToEndAsync();

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Contains("validation.failed", payload);
        Assert.Contains("email", payload);
        Assert.Contains("password", payload);
    }

    [Fact]
    public async Task ValidateRequestActionFilter_ShouldThrowValidationException_WhenValidatorFails()
    {
        var services = new ServiceCollection();
        services.AddScoped<IValidator<SampleRequest>, SampleRequestValidator>();

        using var provider = services.BuildServiceProvider();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = provider
        };

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor(), new ModelStateDictionary());
        var filters = new List<IFilterMetadata>();
        var actionArguments = new Dictionary<string, object?>
        {
            ["request"] = new SampleRequest(string.Empty)
        };

        var executingContext = new ActionExecutingContext(actionContext, filters, actionArguments, new object());
        var filter = new ValidateRequestActionFilter(provider);

        await Assert.ThrowsAsync<ValidationException>(() => filter.OnActionExecutionAsync(
            executingContext,
            () => Task.FromResult(new ActionExecutedContext(actionContext, filters, new object()))));
    }

    private sealed record SampleRequest(string Name);

    private sealed class SampleRequestValidator : AbstractValidator<SampleRequest>
    {
        public SampleRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }
}
