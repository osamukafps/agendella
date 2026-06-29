using Agendella.Api.Contracts.Professionals;
using FluentValidation;

namespace Agendella.Api.Validators.Professionals;

public sealed class UpdateProfessionalRequestValidator : AbstractValidator<UpdateProfessionalRequest>
{
    public UpdateProfessionalRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
    }
}
