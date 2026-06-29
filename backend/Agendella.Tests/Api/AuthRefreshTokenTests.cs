using Agendella.Api.Auth;
using Agendella.Application.Auth;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;
using Agendella.Infrastructure.Auth;
using Agendella.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Agendella.Tests.Api;

public sealed class AuthRefreshTokenTests
{
    [Fact]
    public async Task RefreshTokenService_ShouldRotateTokens_AndRefreshCookieWriterShouldWriteAndClearCookie()
    {
        var options = new DbContextOptionsBuilder<AgendellaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var dbContext = new AgendellaDbContext(options);
        var repository = new RefreshTokenRepository(dbContext);
        var service = new RefreshTokenService(repository);

        var collaborator = new SalonCollaborator
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "admin@test.local",
            Role = CollaboratorRole.Administradora,
            Status = RecordStatus.Active
        };

        dbContext.SalonCollaborators.Add(collaborator);
        await dbContext.SaveChangesAsync();

        var session = await service.CreateSessionAsync(collaborator);
        var rotated = await service.RotateAsync(session.PlainTextToken);

        Assert.NotEqual(session.PlainTextToken, rotated.PlainTextToken);

        var writer = new RefreshCookieWriter(Options.Create(new RefreshCookieOptions
        {
            Name = "agendella_rt",
            Domain = "localhost",
            Path = "/auth",
            Secure = false,
            SameSite = "Strict",
            HttpOnly = true,
            DurationDays = 14
        }));

        var context = new DefaultHttpContext();
        writer.Write(context.Response, rotated.PlainTextToken);
        writer.Clear(context.Response);

        Assert.Contains("agendella_rt=", context.Response.Headers.SetCookie.ToString());
    }
}
