using Agendella.Api.Contracts.Professionals;
using FluentValidation;

namespace Agendella.Api.Validators.Professionals;

public sealed class CreateProfessionalRequestValidator : AbstractValidator<CreateProfessionalRequest>
{
    public CreateProfessionalRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
    }
}
