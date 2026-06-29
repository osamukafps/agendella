using Agendella.Api.Contracts.SalonBlocks;
using FluentValidation;

namespace Agendella.Api.Validators.SalonBlocks;

public sealed class CreateSalonBlockRequestValidator : AbstractValidator<CreateSalonBlockRequest>
{
    public CreateSalonBlockRequestValidator()
    {
        RuleFor(x => x.StartAtUtc).NotEmpty();
        RuleFor(x => x.EndAtUtc).NotEmpty();
        RuleFor(x => x)
            .Must(x => x.EndAtUtc > x.StartAtUtc)
            .WithMessage("EndAtUtc deve ser posterior a StartAtUtc.")
            .OverridePropertyName(nameof(CreateSalonBlockRequest.EndAtUtc));
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
    }
}
