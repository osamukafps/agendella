# Data Model: Salon Scheduling Core MVP

## Conventions

- Tenant-owned tables include `TenantId uuid NOT NULL` and are protected by EF Core global query filters and PostgreSQL RLS.
- Primary keys are UUIDs.
- Instants are stored as UTC `timestamptz`.
- Local business rules use the salon IANA timezone, defaulting the pilot tenant to `America/Sao_Paulo`.
- Soft deactivation is represented by status fields and timestamps; protected entities are not physically deleted in the MVP.
- Services belong to the salon tenant; there is no `ProfessionalService` join entity in the MVP.

## SalonTenant

Represents a salon and tenant boundary.

**Fields**: `Id`, `Name`, `Address`, `Phone`, `TimeZoneId`, `Status`, `MinimumCancellationNoticeMinutes`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Owns collaborators, professionals, services, clients, appointments, business hours, salon blocks, absences, and history events.

**Validation**: `TimeZoneId` must be a valid IANA zone. `Status` controls whether new appointments are accepted. Minimum cancellation notice must be non-negative.

**States**: `Active`, `Inactive`, `Suspended`.

## SalonBusinessHour

Weekly recurring business-hour window for the tenant.

**Fields**: `Id`, `TenantId`, `DayOfWeek`, `StartLocalTime`, `EndLocalTime`, `IsClosed`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Belongs to SalonTenant.

**Validation**: When open, `StartLocalTime < EndLocalTime`. Appointment start must be inside an open business-hour window. Appointment end may exceed closing if start is valid and the interval respects blocks, absences, and appointment conflicts.

## SalonCollaborator

Authenticated internal user.

**Fields**: `Id`, `TenantId`, `Email`, `PasswordHash`, `DisplayName`, `Role`, `Status`, `ProfessionalId`, `TokenVersion`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Belongs to SalonTenant. May link to Professional when role is `profissional`.

**Validation**: Email is unique per tenant. Each collaborator belongs to exactly one tenant. Professional role must only operate on its linked professional scope.

**States**: `Active`, `Inactive`.

## RefreshTokenSession

Persisted rotating refresh token session.

**Fields**: `Id`, `TenantId`, `CollaboratorId`, `TokenHash`, `FamilyId`, `ExpiresAtUtc`, `RotatedAtUtc`, `RevokedAtUtc`, `ReplacedByTokenId`, `CreatedAtUtc`, `UserAgent`, `IpAddress`.

**Relationships**: Belongs to SalonCollaborator and tenant.

**Validation**: Refresh tokens are one-time-use. Reuse of a rotated token revokes the token family.

**States**: `Active`, `Rotated`, `Revoked`, `Expired`.

## Professional

Service professional record.

**Fields**: `Id`, `TenantId`, `Name`, `Phone`, `Email`, `Status`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Has weekly availability, absences, and appointments. May link to a collaborator.

**Validation**: New appointments and reschedules require active professional in the active tenant.

**States**: `Active`, `Inactive`.

## ProfessionalWeeklyAvailability

Recurring availability window for a professional.

**Fields**: `Id`, `TenantId`, `ProfessionalId`, `DayOfWeek`, `StartLocalTime`, `EndLocalTime`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Belongs to Professional and tenant.

**Validation**: `StartLocalTime < EndLocalTime`. Appointment start must be in the intersection of salon business hours and professional availability.

## Service

Service offered by the salon.

**Fields**: `Id`, `TenantId`, `Name`, `Description`, `DurationMinutes`, `PriceAmount`, `Currency`, `Status`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Referenced by Appointment. Belongs only to the tenant, not to individual professionals.

**Validation**: `DurationMinutes > 0`. New appointments and reschedules require an active service in the active tenant. Any active professional in the same tenant may execute any active service in that tenant.

**States**: `Active`, `Inactive`.

## Client

Operational customer record, not an authenticated user.

**Fields**: `Id`, `TenantId`, `Name`, `Phone`, `Email`, `Notes`, `Status`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Has appointments and client history events.

**Validation**: `Phone` is unique per tenant. New appointments and reschedules require an active client in the active tenant. Deactivation preserves future appointments and marks them for review.

**Indexes**: Unique index on `(TenantId, Phone)`.

**States**: `Active`, `Inactive`.

## Appointment

Scheduled service/attendance record.

**Fields**: `Id`, `TenantId`, `ClientId`, `ProfessionalId`, `ServiceId`, `StartAtUtc`, `EndAtUtc`, `Status`, `RequiresReview`, `ReviewReason`, `CreatedByCollaboratorId`, `UpdatedAtUtc`, `CreatedAtUtc`.

**Relationships**: Belongs to tenant, client, professional, service, and creator. Has history events.

**Validation**: Effective end comes from manual end when provided, otherwise service duration. End must be greater than start. Overlap is forbidden for the same tenant/professional except consecutive `existing.EndAtUtc == new.StartAtUtc` or `new.EndAtUtc == existing.StartAtUtc`. References must be same tenant and active for new appointments/reschedules. `ServiceId` must point to an active tenant service, and `ProfessionalId` may reference any active professional in the same tenant because the MVP has no per-professional service mapping. Confirmation revalidates availability and conflicts in a transaction.

**States**: `Scheduled`, `Cancelled`, `Completed`, `NoShow`.

**Review flag**: `RequiresReview` can be set by conflicting block/absence, deactivation, or business-hour changes. It remains visible until manually resolved.

## SalonBlock

Tenant-wide unavailability window.

**Fields**: `Id`, `TenantId`, `StartAtUtc`, `EndAtUtc`, `Reason`, `CreatedByCollaboratorId`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Belongs to tenant.

**Validation**: End must be greater than start. New appointments/reschedules overlapping the block are rejected. Creating a block over existing appointments preserves them and marks affected appointments for review.

## ProfessionalAbsence

Professional-specific unavailability window.

**Fields**: `Id`, `TenantId`, `ProfessionalId`, `StartAtUtc`, `EndAtUtc`, `Reason`, `Status`, `CancelledAtUtc`, `CreatedByCollaboratorId`, `CreatedAtUtc`, `UpdatedAtUtc`.

**Relationships**: Belongs to tenant and professional.

**Validation**: End must be greater than start. New appointments/reschedules overlapping an active absence are rejected. Creating an absence over existing appointments preserves them and marks affected appointments for review. Cancelling an absence changes its status and stops it from blocking new appointments.

**States**: `Active`, `Cancelled`.

## ClientHistoryEvent

Read-only operational history for a client.

**Fields**: `Id`, `TenantId`, `ClientId`, `AppointmentId`, `Type`, `OccurredAtUtc`, `Description`, `CreatedByCollaboratorId`, `CreatedAtUtc`.

**Relationships**: Belongs to tenant and client; optionally belongs to appointment.

**Validation**: References must stay within the same tenant. Professional reads are restricted to events related to her own appointments.

**Types**: `AppointmentCreated`, `Rescheduled`, `Cancelled`, `LateCancelled`, `NoShow`, `ReviewRequired`, `ReviewResolved`.

## Availability Evaluation Order

1. Resolve tenant and role.
2. Verify salon, professional, service, and client are active and in the same tenant.
3. Verify the service belongs to the tenant and does not require any professional-specific mapping because none exists in the MVP.
4. Compute effective appointment window.
5. Validate appointment start against salon business hours in salon local time.
6. Validate appointment start against professional weekly availability in salon local time.
7. Reject if the occupied interval overlaps a salon block.
8. Reject if the occupied interval overlaps an active professional absence.
9. Reject if the occupied interval overlaps another active appointment for the same professional.
10. Persist only after transaction-scoped revalidation succeeds.
