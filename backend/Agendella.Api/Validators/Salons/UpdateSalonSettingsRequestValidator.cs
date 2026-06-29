using Agendella.Api.Contracts.Salons;
using FluentValidation;

namespace Agendella.Api.Validators.Salons;

public sealed class UpdateSalonSettingsRequestValidator : AbstractValidator<UpdateSalonSettingsRequest>
{
    public UpdateSalonSettingsRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.TimeZoneId).NotEmpty().MaximumLength(100)
            .Must(tz => TimeZoneInfo.TryFindSystemTimeZoneById(tz, out _))
            .WithMessage("TimeZoneId deve ser um fuso horario IANA valido.");
        RuleFor(x => x.MinimumCancellationNoticeMinutes).GreaterThanOrEqualTo(0);
    }
}
