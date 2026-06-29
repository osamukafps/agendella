using Agendella.Api.Middleware;
using Agendella.Api.Tenancy;
using Agendella.Api.Validation;
using Agendella.Application.Tenancy;
using Agendella.Infrastructure.Configuration;
using Agendella.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddApiValidation();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<HttpTenantContext>();
builder.Services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<HttpTenantContext>());
builder.Services.AddScoped<TenantSessionInterceptor>();
builder.Services.AddDbContext<AgendellaDbContext>((provider, options) =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetSection(DatabaseOptions.SectionName)[nameof(DatabaseOptions.Postgres)]
        ?? throw new InvalidOperationException("Postgres connection string was not configured.");

    options.UseNpgsql(connectionString);
    options.AddInterceptors(provider.GetRequiredService<TenantSessionInterceptor>());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseMiddleware<TenantResolutionMiddleware>();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }))
    .WithName("Healthz");

app.Run();

public partial class Program;
