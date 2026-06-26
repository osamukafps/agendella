# Implementation Plan: Salon Scheduling Core MVP

**Branch**: `main` | **Date**: 2026-06-26 | **Spec**: `specs/001-salon-scheduling-core/spec.md`

**Input**: Feature specification from `specs/001-salon-scheduling-core/spec.md` plus technical architecture supplied in the planning request.

## Summary

Build the Agendella MVP as a modular monorepo with two independent applications: `backend/` for an ASP.NET Core Web API on .NET 10 and `frontend/` for an Angular SPA. The backend owns authentication, tenant isolation, scheduling invariants, PostgreSQL persistence, EF Core migrations, JWT access plus rotating refresh tokens, structured error handling, and domain tests. The frontend provides mobile-first authenticated workflows for administradora and profissional using Angular standalone components, signals, TailwindCSS, route guards, HTTP interceptors, and Vitest.

The architecture stays intentionally simple: a modular monolith backend split into API, Application, Domain, and Infrastructure layers, REST/OpenAPI contracts, one PostgreSQL schema with `TenantId` on tenant data, EF Core global query filters, PostgreSQL Row-Level Security as defense in depth, and Docker only for VPS deployment. Services belong to the salon tenant, not to individual professionals, so any active professional in the tenant can execute any active service in the tenant.

## Technical Context

**Language/Version**: C# on .NET 10 for backend; TypeScript on Angular current stable for frontend.

**Primary Dependencies**: ASP.NET Core Web API, Entity Framework Core, Npgsql EF Core provider, ASP.NET Core authentication/authorization, `System.Threading.RateLimiting` / `Microsoft.AspNetCore.RateLimiting`, xUnit, Angular standalone components, Angular Router/HttpClient, TailwindCSS, Vitest. Optional frontend headless utilities may use Angular CDK only where needed for overlays or date/time picker primitives.

**Storage**: PostgreSQL 16 or newer, single schema, tenant-owned tables include `TenantId uuid`, timestamps stored as `timestamptz` UTC, EF Core migrations manage schema changes.

**Testing**: xUnit unit and integration tests for backend domain/application/infrastructure; Vitest for frontend unit/component tests of auth flows, guards, interceptors, and key mobile UI behaviors. Critical backend coverage is mandatory for tenant isolation, role authorization, conflict detection, availability validation, unavailability precedence, concurrency on scheduling operations, timezone conversion boundaries, unique client phone per tenant, and cancellation/remarcation rules.

**Target Platform**: Local development on Ubuntu with native .NET SDK and native PostgreSQL; production on a simple Linux VPS using Docker images for backend and frontend, PostgreSQL on the same host, nginx reverse proxy, HTTPS via Let's Encrypt, external daily backups.

**Project Type**: Web application monorepo with independent backend API and frontend SPA.

**Performance Goals**: Mobile agenda interactions should feel immediate for MVP scale; target API p95 below 300 ms for common tenant-scoped reads under normal VPS load. Scheduling confirmation must use database-backed consistency rather than optimistic UI assumptions.

**Constraints**: No microservices, no GraphQL, no message broker, no distributed cache, no billing implementation, no heavy frontend UI kit, no Docker requirement for local development, server-side authorization mandatory, tenant scoping mandatory in application and database layers, refresh tokens stored only in secure cookies, and all list endpoints use cursor pagination.

**Scale/Scope**: MVP for a pilot salon and early multi-tenant readiness. Design for dozens of salons and thousands of appointments without speculative infrastructure. Future modules such as billing, notifications, finance, loyalty, and multi-unit support must be additive.

## Database And Tenant Isolation

- One PostgreSQL schema for the MVP.
- Every tenant-owned table carries `TenantId` and receives both EF Core global query filters and PostgreSQL RLS.
- RLS must be enabled explicitly on every table with `TenantId`, namely:
  - `SalonBusinessHours`
  - `SalonCollaborators`
  - `RefreshTokenSessions`
  - `Professionals`
  - `ProfessionalWeeklyAvailabilities`
  - `Services`
  - `Clients`
  - `Appointments`
  - `SalonBlocks`
  - `ProfessionalAbsences`
  - `ClientHistoryEvents`
- The backend sets `app.tenant_id` as a session GUC on every normal authenticated request before tenant-scoped queries run.
- Initial salon setup and maintenance flows use a separate reviewed database role that can bypass RLS. That role is isolated from normal authenticated request handling.

## Authentication And Session Security

- Access tokens are short-lived JWT bearer tokens signed with RSA.
- Refresh tokens are persisted in PostgreSQL and delivered to the client only as cookies with:
  - `HttpOnly`
  - `Secure`
  - `SameSite=Strict`
  - `Path=/auth`
  - backend domain scope
- `POST /auth/refresh` reads the refresh token from the cookie automatically and does not accept a request body.
- `POST /auth/logout` revokes the refresh-token session and clears the refresh-token cookie.
- Access-token protected endpoints use `Authorization: Bearer` and do not depend on cookies.

## CSRF Strategy

- `SameSite=Strict` on the refresh-token cookie covers the common cross-site case.
- Because `/auth/refresh` and `/auth/logout` are cookie-dependent state-changing endpoints, the frontend must also send `X-CSRF-Protection: 1` on both requests.
- The backend must reject those requests when the header is missing.
- All other authenticated endpoints rely on bearer tokens rather than ambient cookies and are therefore not CSRF-vulnerable by construction.

## Rate Limiting

- `POST /auth/login`: 5 attempts per IP per minute and 10 attempts per `(IP + email)` per hour.
- `POST /auth/refresh`: 30 requests per IP per minute.
- Other authenticated endpoints: 120 requests per minute per authenticated collaborator.
- Implement with native .NET rate limiting middleware: `System.Threading.RateLimiting` / `Microsoft.AspNetCore.RateLimiting`.
- A limited request returns HTTP `429` with `ErrorResponse`, code `rate_limit.exceeded`, and a `Retry-After` header.

## Constitution Check

*GATE: Passed before Phase 0 research.*

- Tenant isolation: active tenant is the `TenantId` claim of the authenticated Colaboradora do Salao. Every tenant-owned entity includes `TenantId`; EF Core global query filters apply by default; PostgreSQL RLS enforces the same boundary through a session GUC (`app.tenant_id`). Logs, exports, reports, and jobs must include explicit tenant context unless they run through reviewed admin services using a separate database role.
- Role enforcement: server policies distinguish `administradora` and `profissional`. Administradora may manage the tenant. Profissional may operate only her own agenda, absences, allowed client mutations, and own appointment history. Frontend guards improve UX but are not authoritative.
- Scheduling integrity: appointment windows use effective start/end, allow consecutive appointments where `end == start`, reject overlaps for the same professional, validate start time against salon business hours and professional weekly availability, reject blocks/absences over the occupied interval, and revalidate inside the confirmation transaction. Existing appointments affected by blocks, absences, deactivation, or business-hour changes are preserved and marked `requiresReview` with a visible reason. Services are tenant-owned and do not require per-professional linkage.
- Privacy and LGPD: customer data is limited to operational contact and history fields. Phone numbers are unique per tenant. No third-party sharing is planned. Future export/deletion flows remain possible because client data is centralized by tenant and history records are explicit.
- MVP and modularity: this is the scheduling core and belongs in the MVP. Billing, payment, notifications, finance, loyalty, analytics, microservices, messaging, and distributed cache are excluded and must not complicate the initial model.
- Billing readiness: no entitlement logic is implemented now. A future `ActivePlan`/entitlement middleware can be inserted after authentication and tenant resolution without rewriting scheduling rules.
- Responsive web: primary flows target mobile browser use by professionals: own agenda, create/reschedule/cancel appointment, register client, refresh session transparently, and mark absence. Desktop adds wider calendar/list layouts for administrators without separate business logic.
- Quality gates: automated tests are required for tenant isolation, role authorization, appointment conflicts, manual end precedence, availability order, concurrency, timezone boundaries, unique phone enforcement, CSRF checks on cookie-based auth endpoints, and review-flagging behavior.

## Project Structure

### Documentation (this feature)

```text
specs/001-salon-scheduling-core/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── Agendella.Api/
│   ├── Controllers/
│   ├── Auth/
│   ├── Middleware/
│   └── Program.cs
├── Agendella.Application/
│   ├── Scheduling/
│   ├── Salons/
│   ├── Clients/
│   ├── Services/
│   ├── Professionals/
│   └── Auth/
├── Agendella.Domain/
│   ├── Entities/
│   ├── ValueObjects/
│   ├── Scheduling/
│   └── Common/
├── Agendella.Infrastructure/
│   ├── Persistence/
│   ├── Repositories/
│   ├── Auth/
│   └── Migrations/
├── Agendella.Tests/
│   ├── Domain/
│   ├── Application/
│   └── Infrastructure/
├── Dockerfile
└── Agendella.sln

frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── http/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── agenda/
│   │   │   ├── clients/
│   │   │   ├── professionals/
│   │   │   ├── services/
│   │   │   └── salon-settings/
│   │   └── shared/
│   ├── styles.css
│   └── main.ts
├── vitest.config.ts
├── nginx.conf
├── Dockerfile
└── package.json

deploy/
├── docker-compose.yml
├── nginx/
└── backups/

docs/
└── local-development.md
```

**Structure Decision**: Use the requested two-application monorepo. Backend projects keep a small layered architecture without CQRS or MediatR. Frontend groups standalone components by feature and shared core services by concern, and uses Vitest for frontend test execution. Deployment assets live outside both apps so local native development remains separate from production Docker deployment.

## Post-Design Constitution Re-Check

*Re-check after Phase 1 design: Passed.*

- Tenant Isolation by Default: still satisfied through EF filters, explicit tenant context, cursor-paginated tenant-scoped endpoints, and RLS on every `TenantId` table.
- Server-Enforced Role Boundaries: still satisfied through role-specific endpoints and server authorization rules for salon settings, professional self-service scope, client history visibility, and review-resolution actions.
- Scheduling Integrity Is Sacred: still satisfied through transaction-scoped validation, conflict-specific `409` responses, tenant-owned service model, review flags, and explicit completion/no-show/review-resolution actions.
- LGPD-Respecting Customer Privacy: still satisfied; unique phone per tenant does not expand data collection, and structured errors must avoid leaking other-tenant presence.
- MVP Core Before Adjacent Features: still satisfied; rate limiting, CSRF protection, structured errors, and refresh-cookie handling strengthen the core without adding adjacent product scope.
- Billing-Ready Architecture Without MVP Billing: unchanged and still compliant.
- Responsive Web Is a Product Requirement: still satisfied; auth refresh and protected flows remain mobile-friendly.
- Specification-Led Quality Gates: still satisfied; the design now explicitly demands automated tests for unique phone constraints, CSRF, refresh-cookie flows, and rate limiting behavior alongside existing scheduling rules.
- Modular Growth Under YAGNI: still satisfied; no `ProfessionalService` link table or extra module was introduced.

## Complexity Tracking

No constitutional violations requiring exception were introduced.
