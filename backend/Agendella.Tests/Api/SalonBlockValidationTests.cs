using Agendella.Api.Contracts.SalonBlocks;
using Agendella.Api.Validators.SalonBlocks;

namespace Agendella.Tests.Api;

public sealed class SalonBlockValidationTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void CreateSalonBlockValidator_ShouldRejectBlankReason(string reason)
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(
            Now.AddHours(1), Now.AddHours(3), reason));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateSalonBlockRequest.Reason));
    }

    [Fact]
    public void CreateSalonBlockValidator_ShouldRejectReasonTooLong()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var longReason = new string('A', 1001);
        var result = validator.Validate(new CreateSalonBlockRequest(
            Now.AddHours(1), Now.AddHours(3), longReason));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateSalonBlockRequest.Reason));
    }

    [Fact]
    public void CreateSalonBlockValidator_ShouldAcceptMinimalValidRequest()
    {
        var validator = new CreateSalonBlockRequestValidator();
        var result = validator.Validate(new CreateSalonBlockRequest(
            Now.AddMinutes(1), Now.AddMinutes(2), "A"));

        Assert.True(result.IsValid);
    }
}
