using Agendella.Api.Contracts.Appointments;
using FluentValidation;

namespace Agendella.Api.Validators.Appointments;

public sealed class RescheduleAppointmentRequestValidator : AbstractValidator<RescheduleAppointmentRequest>
{
    public RescheduleAppointmentRequestValidator()
    {
        RuleFor(x => x.NewStartAtUtc).NotEmpty();
        RuleFor(x => x)
            .Must(x => !x.NewManualEndAtUtc.HasValue || x.NewManualEndAtUtc.Value > x.NewStartAtUtc)
            .WithMessage("NewManualEndAtUtc deve ser posterior a NewStartAtUtc quando informado.")
            .OverridePropertyName(nameof(RescheduleAppointmentRequest.NewManualEndAtUtc));
    }
}
