namespace Agendella.Application.Common.Errors;

public static class ErrorCodes
{
    public const string Unexpected = "unexpected.error";

    public const string ValidationFailed = "validation.failed";

    public const string ResourceNotFound = "resource.not_found";

    public const string Forbidden = "authorization.forbidden";

    public const string Unauthorized = "authorization.unauthorized";

    public const string Conflict = "resource.conflict";

    public const string InvalidCredentials = "auth.invalid_credentials";

    public const string RefreshTokenInvalid = "auth.refresh.invalid";

    public const string CsrfProtectionMissing = "auth.csrf.missing";

    public const string RateLimitExceeded = "rate_limit.exceeded";

    public const string ClientPhoneDuplicate = "client.phone.duplicate";

    public const string AppointmentConflict = "appointment.conflict";
    public const string AppointmentNotScheduled = "appointment.not_scheduled";
    public const string AppointmentServiceInactive = "appointment.service.inactive";
    public const string AppointmentProfessionalInactive = "appointment.professional.inactive";
    public const string AppointmentClientInactive = "appointment.client.inactive";
    public const string CancellationWindowExpired = "appointment.cancellation_window_expired";
    public const string AppointmentReviewNotRequired = "appointment.review_not_required";
}
