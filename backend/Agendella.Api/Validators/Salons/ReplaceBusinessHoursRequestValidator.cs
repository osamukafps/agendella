using Agendella.Api.Contracts.Salons;
using FluentValidation;

namespace Agendella.Api.Validators.Salons;

public sealed class ReplaceBusinessHoursRequestValidator : AbstractValidator<ReplaceBusinessHoursRequest>
{
    public ReplaceBusinessHoursRequestValidator()
    {
        RuleFor(x => x.BusinessHours).NotNull();
        RuleForEach(x => x.BusinessHours).SetValidator(new BusinessHourDtoValidator());
    }
}

public sealed class BusinessHourDtoValidator : AbstractValidator<BusinessHourDto>
{
    private static readonly HashSet<string> ValidDays =
    [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    public BusinessHourDtoValidator()
    {
        RuleFor(x => x.DayOfWeek).NotEmpty().Must(d => ValidDays.Contains(d))
            .WithMessage("DayOfWeek deve ser um dia da semana valido em ingles.");

        When(x => !x.IsClosed, () =>
        {
            RuleFor(x => x.StartLocalTime).NotEmpty()
                .WithMessage("StartLocalTime e obrigatorio quando o dia nao esta fechado.")
                .Must(t => TimeOnly.TryParse(t, out _))
                .WithMessage("StartLocalTime deve ser um horario valido (HH:mm ou HH:mm:ss).");

            RuleFor(x => x.EndLocalTime).NotEmpty()
                .WithMessage("EndLocalTime e obrigatorio quando o dia nao esta fechado.")
                .Must(t => TimeOnly.TryParse(t, out _))
                .WithMessage("EndLocalTime deve ser um horario valido (HH:mm ou HH:mm:ss).");

            RuleFor(x => x)
                .Must(x =>
                {
                    if (!TimeOnly.TryParse(x.StartLocalTime, out var start) ||
                        !TimeOnly.TryParse(x.EndLocalTime, out var end))
                    {
                        return true;
                    }
                    return start < end;
                })
                .WithMessage("StartLocalTime deve ser anterior a EndLocalTime.")
                .OverridePropertyName("StartLocalTime");
        });
    }
}
