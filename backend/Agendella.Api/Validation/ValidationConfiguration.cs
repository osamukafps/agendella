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

            if (validator is not IValidator nonGenericValidator)
            {
                continue;
            }

            var validationContext = new ValidationContext<object>(argument);
            var result = await nonGenericValidator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

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
