using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Agendella.Api.Validation;

public static class ValidationConfiguration
{
    public static IServiceCollection AddApiValidation(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<ValidateRequestActionFilter>(ServiceLifetime.Scoped);
        services.AddScoped<ValidateRequestActionFilter>();

        services.Configure<MvcOptions>(options =>
        {
            options.Filters.AddService<ValidateRequestActionFilter>();
        });

        return services;
    }
}

public sealed class ValidateRequestActionFilter(IServiceProvider serviceProvider) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var failures = new List<ValidationFailure>();

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            var validator = serviceProvider.GetService(validatorType);

            if (validator is null)
            {
                continue;
            }

            var validationContextType = typeof(ValidationContext<>).MakeGenericType(argument.GetType());
            var validationContext = Activator.CreateInstance(validationContextType, argument)
                ?? throw new InvalidOperationException($"Could not create validation context for {argument.GetType().Name}.");

            var validateAsyncMethod = validatorType.GetMethod(nameof(IValidator<object>.ValidateAsync), [validationContextType, typeof(CancellationToken)])
                ?? throw new InvalidOperationException($"Could not locate ValidateAsync on validator {validatorType.Name}.");

            var task = (Task)validateAsyncMethod.Invoke(validator, [validationContext, context.HttpContext.RequestAborted])!;
            await task;

            var resultProperty = task.GetType().GetProperty("Result")
                ?? throw new InvalidOperationException("Validation task did not expose a Result property.");

            var result = resultProperty.GetValue(task) as ValidationResult
                ?? throw new InvalidOperationException("Validation task result was not a ValidationResult.");

            if (!result.IsValid)
            {
                failures.AddRange(result.Errors);
            }
        }

        if (failures.Count > 0)
        {
            throw new ValidationException(failures);
        }

        await next();
    }
}
