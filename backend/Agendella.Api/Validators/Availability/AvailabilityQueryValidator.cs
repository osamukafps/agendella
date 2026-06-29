using FluentValidation;

namespace Agendella.Api.Validators.Availability;

public sealed record AvailabilityQuery(Guid ProfessionalId, DateOnly Date, int DurationMinutes);

public sealed class AvailabilityQueryValidator : AbstractValidator<AvailabilityQuery>
{
    public AvailabilityQueryValidator()
    {
        RuleFor(x => x.ProfessionalId).NotEmpty();
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
    }
}
