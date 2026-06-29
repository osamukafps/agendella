using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;

namespace Agendella.Application.Professionals;

public sealed record AvailabilityEntry(
    DayOfWeek DayOfWeek,
    TimeOnly StartLocalTime,
    TimeOnly EndLocalTime);

public sealed class WeeklyAvailabilityService(ITenantContext tenantContext, IProfessionalStore store)
{
    public async Task<IReadOnlyList<ProfessionalWeeklyAvailability>> GetAsync(
        Guid professionalId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        await EnsureProfessionalAccessAsync(professionalId, requesterProfessionalId, cancellationToken);
        return await store.GetWeeklyAvailabilityAsync(professionalId, cancellationToken);
    }

    public async Task<IReadOnlyList<ProfessionalWeeklyAvailability>> ReplaceAsync(
        Guid professionalId,
        Guid? requesterProfessionalId,
        IReadOnlyList<AvailabilityEntry> entries,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        await EnsureProfessionalAccessAsync(professionalId, requesterProfessionalId, cancellationToken);

        var slots = entries.Select(e => new ProfessionalWeeklyAvailability
        {
            TenantId = tenantId,
            ProfessionalId = professionalId,
            DayOfWeek = e.DayOfWeek,
            StartLocalTime = e.StartLocalTime,
            EndLocalTime = e.EndLocalTime,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        }).ToList();

        await store.ReplaceWeeklyAvailabilityAsync(professionalId, tenantId, slots, cancellationToken);
        return slots;
    }

    private async Task EnsureProfessionalAccessAsync(
        Guid professionalId,
        Guid? requesterProfessionalId,
        CancellationToken cancellationToken)
    {
        var professional = await store.FindByIdAsync(professionalId, cancellationToken)
            ?? throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.ResourceNotFound, "Profissional nao encontrado.", 404));

        if (requesterProfessionalId.HasValue && requesterProfessionalId.Value != professionalId)
        {
            throw new ApplicationRuleException(new ApplicationError(
                ErrorCodes.Forbidden,
                "Profissional nao pode acessar disponibilidade de outro profissional.",
                403));
        }
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new ApplicationRuleException(new ApplicationError(
            ErrorCodes.Unauthorized, "Requisicao sem contexto de tenant.", 401));
}
