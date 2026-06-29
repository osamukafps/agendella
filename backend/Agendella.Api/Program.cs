using System.Text;
using Agendella.Api.Auth;
using Agendella.Api.Configuration;
using Agendella.Api.Middleware;
using Agendella.Api.Tenancy;
using Agendella.Api.Validation;
using Agendella.Application.Auth;
using Agendella.Application.Clients;
using Agendella.Application.Professionals;
using Agendella.Application.Salons;
using Agendella.Application.Scheduling;
using Agendella.Application.Services;
using Agendella.Application.Tenancy;
using Agendella.Infrastructure.Auth;
using Agendella.Infrastructure.Configuration;
using Agendella.Infrastructure.Persistence;
using Agendella.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var refreshCookieOptions = builder.Configuration.GetSection(RefreshCookieOptions.SectionName).Get<RefreshCookieOptions>() ?? new RefreshCookieOptions();
var signingKeyProvider = JwtSigningKeyProvider.Create(jwtOptions);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddApiValidation();
builder.Services.AddOpenApi();
builder.Services.AddConfiguredCors(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<HttpTenantContext>();
builder.Services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<HttpTenantContext>());
builder.Services.AddScoped<TenantSessionInterceptor>();
builder.Services.AddSingleton(signingKeyProvider);
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<RefreshCookieOptions>(builder.Configuration.GetSection(RefreshCookieOptions.SectionName));
builder.Services.AddScoped<Agendella.Application.Auth.IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IAuthCollaboratorStore, CollaboratorCredentialStore>();
builder.Services.AddScoped<IRefreshTokenSessionStore, RefreshTokenRepository>();
builder.Services.AddScoped<CredentialService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<RefreshCookieWriter>();
builder.Services.AddScoped<ISalonStore, SalonRepository>();
builder.Services.AddScoped<SalonSettingsService>();
builder.Services.AddScoped<BusinessHoursService>();
builder.Services.AddScoped<IServiceCatalogStore, ServiceCatalogRepository>();
builder.Services.AddScoped<ServiceCatalogService>();
builder.Services.AddScoped<IProfessionalStore, ProfessionalRepository>();
builder.Services.AddScoped<ProfessionalManagementService>();
builder.Services.AddScoped<WeeklyAvailabilityService>();
builder.Services.AddScoped<IClientStore, ClientRepository>();
builder.Services.AddScoped<ClientManagementService>();
builder.Services.AddScoped<AppointmentRepository>();
builder.Services.AddScoped<IAppointmentStore>(sp => sp.GetRequiredService<AppointmentRepository>());
builder.Services.AddScoped<ISchedulingDataStore>(sp => sp.GetRequiredService<AppointmentRepository>());
builder.Services.AddScoped<AvailabilityService>();
builder.Services.AddScoped<AppointmentSchedulingService>();
builder.Services.AddScoped<AppointmentCancellationService>();
builder.Services.AddScoped<AppointmentOutcomeService>();
builder.Services.AddScoped<AppointmentReviewService>();
builder.Services.AddScoped<ISalonBlockStore, SalonBlockRepository>();
builder.Services.AddScoped<SalonBlockService>();
builder.Services.AddScoped<IProfessionalAbsenceStore, ProfessionalAbsenceRepository>();
builder.Services.AddScoped<ProfessionalAbsenceService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKeyProvider.SigningKey,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = JwtRegisteredClaimNames.Email,
            RoleClaimType = "role"
        };
    });
builder.Services.AddAuthorizationPolicies();
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
app.UseCors(CorsConfiguration.PolicyName);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseMiddleware<CsrfProtectionMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }))
    .WithName("Healthz");

app.Run();

public partial class Program;
