namespace Agendella.Tests.Api;

public sealed class OpenApiContractTests
{
    private static readonly string OpenApiContractPath = Path.GetFullPath(
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "specs", "001-salon-scheduling-core", "contracts", "openapi.yaml"));

    [Fact]
    public void OpenApiContract_ShouldDeclareStructuredErrorSchemas()
    {
        var yaml = File.ReadAllText(OpenApiContractPath);

        Assert.Contains("ErrorResponse:", yaml);
        Assert.Contains("AppointmentConflictResponse:", yaml);
        Assert.Contains("PaginatedResponse:", yaml);
    }

    [Fact]
    public void OpenApiContract_ShouldReferenceErrorResponseIn4xxAnd5xxResponses()
    {
        var yaml = File.ReadAllText(OpenApiContractPath);

        Assert.Contains("BadRequestError:", yaml);
        Assert.Contains("UnauthorizedError:", yaml);
        Assert.Contains("ForbiddenError:", yaml);
        Assert.Contains("NotFoundError:", yaml);
        Assert.Contains("ConflictError:", yaml);
        Assert.Contains("TooManyRequestsError:", yaml);
        Assert.Contains("InternalServerError:", yaml);
        Assert.Contains("#/components/schemas/ErrorResponse", yaml);
    }
}
