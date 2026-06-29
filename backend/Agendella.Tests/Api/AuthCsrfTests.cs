using System.Text;
using Agendella.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace Agendella.Tests.Api;

public sealed class AuthCsrfTests
{
    [Theory]
    [InlineData("/auth/refresh")]
    [InlineData("/auth/logout")]
    public async Task CsrfProtectionMiddleware_ShouldRejectMissingHeader(string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();

        var errorMiddleware = new ErrorHandlingMiddleware(
            innerContext => new CsrfProtectionMiddleware(_ => Task.CompletedTask).InvokeAsync(innerContext),
            NullLogger<ErrorHandlingMiddleware>.Instance);

        await errorMiddleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        var payload = await new StreamReader(context.Response.Body, Encoding.UTF8, leaveOpen: true).ReadToEndAsync();

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Contains("auth.csrf.missing", payload);
    }
}
