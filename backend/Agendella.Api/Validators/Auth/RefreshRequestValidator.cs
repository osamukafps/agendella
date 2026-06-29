using Agendella.Api.Contracts.Auth;
using FluentValidation;

namespace Agendella.Api.Validators.Auth;

public sealed class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
    }
}
