using Agendella.Api.Contracts.Appointments;
using FluentValidation;

namespace Agendella.Api.Validators.Appointments;

public sealed class CreateAppointmentRequestValidator : AbstractValidator<CreateAppointmentRequest>
{
    public CreateAppointmentRequestValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.ProfessionalId).NotEmpty();
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.StartAtUtc).NotEmpty();
        RuleFor(x => x)
            .Must(x => !x.ManualEndAtUtc.HasValue || x.ManualEndAtUtc.Value > x.StartAtUtc)
            .WithMessage("ManualEndAtUtc deve ser posterior a StartAtUtc quando informado.")
            .OverridePropertyName(nameof(CreateAppointmentRequest.ManualEndAtUtc));
    }
}
