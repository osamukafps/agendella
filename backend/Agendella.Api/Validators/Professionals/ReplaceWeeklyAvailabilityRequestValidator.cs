using Agendella.Api.Contracts.Professionals;
using FluentValidation;

namespace Agendella.Api.Validators.Professionals;

public sealed class ReplaceWeeklyAvailabilityRequestValidator : AbstractValidator<ReplaceWeeklyAvailabilityRequest>
{
    public ReplaceWeeklyAvailabilityRequestValidator()
    {
        RuleFor(x => x.Slots).NotNull();
        RuleForEach(x => x.Slots).SetValidator(new WeeklyAvailabilityEntryDtoValidator());
    }
}

public sealed class WeeklyAvailabilityEntryDtoValidator : AbstractValidator<WeeklyAvailabilityEntryDto>
{
    private static readonly HashSet<string> ValidDays =
    [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    public WeeklyAvailabilityEntryDtoValidator()
    {
        RuleFor(x => x.DayOfWeek).NotEmpty().Must(d => ValidDays.Contains(d))
            .WithMessage("DayOfWeek deve ser um dia da semana valido em ingles.");

        RuleFor(x => x.StartLocalTime).NotEmpty()
            .Must(t => TimeOnly.TryParse(t, out _))
            .WithMessage("StartLocalTime deve ser um horario valido (HH:mm ou HH:mm:ss).");

        RuleFor(x => x.EndLocalTime).NotEmpty()
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
    }
}
