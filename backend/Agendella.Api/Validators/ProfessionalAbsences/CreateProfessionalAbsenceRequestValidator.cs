using Agendella.Api.Contracts.ProfessionalAbsences;
using FluentValidation;

namespace Agendella.Api.Validators.ProfessionalAbsences;

public sealed class CreateProfessionalAbsenceRequestValidator : AbstractValidator<CreateProfessionalAbsenceRequest>
{
    public CreateProfessionalAbsenceRequestValidator()
    {
        RuleFor(x => x.ProfessionalId).NotEmpty();
        RuleFor(x => x.StartAtUtc).NotEmpty();
        RuleFor(x => x.EndAtUtc).NotEmpty();
        RuleFor(x => x)
            .Must(x => x.EndAtUtc > x.StartAtUtc)
            .WithMessage("EndAtUtc deve ser posterior a StartAtUtc.")
            .OverridePropertyName(nameof(CreateProfessionalAbsenceRequest.EndAtUtc));
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
    }
}
