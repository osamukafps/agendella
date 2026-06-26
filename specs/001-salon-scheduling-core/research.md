# Research: Salon Scheduling Core MVP

## Decision: Backend architecture

Use a modular monolith in `backend/` with four projects: API, Application, Domain, and Infrastructure.

**Rationale**: The product has meaningful domain rules, persistence concerns, and API boundaries, but the MVP does not justify CQRS, MediatR, microservices, or separate bounded deployments. A small layered structure keeps scheduling invariants testable without over-engineering.

**Alternatives considered**: Single ASP.NET Core project was simpler but would mix EF, controllers, and domain rules too early. Full clean architecture with CQRS/MediatR was more ceremony than current scope needs. Microservices were rejected by the explicit non-goal and would weaken consistency for scheduling.

## Decision: Authentication token model

Use short-lived JWT access tokens plus rotating refresh tokens persisted in PostgreSQL.

**Rationale**: The requirement includes immediate revocation when a professional is disabled or a salon is suspended. Pure stateless access tokens cannot be revoked before expiry without adding a server-side revocation check, which removes most of their simplicity. Persisted rotating refresh tokens allow session revocation, reuse detection, and safer browser UX. Access tokens should remain short-lived and include tenant, user, role, and token version/session claims.

**Alternatives considered**: JWT access token only is operationally simple but weak for immediate revocation. Opaque server sessions simplify revocation but add more state to every API call and are less natural for SPA/API separation. Access plus rotating refresh gives the best trade-off for this MVP.

## Decision: Refresh token transport

Deliver the refresh token exclusively as a cookie with `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/auth`, and backend-domain scope.

**Rationale**: The refresh token should never be exposed to frontend JavaScript or local storage. Restricting it to `/auth` reduces accidental attachment surface, and using cookies keeps the SPA focused on access-token memory handling only.

**Alternatives considered**: Returning the refresh token in JSON would expose it to XSS and persistence mistakes. Storing it in `localStorage` or `sessionStorage` was rejected for the same reason.

## Decision: CSRF protection for cookie-based auth endpoints

Require `X-CSRF-Protection: 1` on `POST /auth/refresh` and `POST /auth/logout` in addition to the strict cookie settings.

**Rationale**: `SameSite=Strict` covers the common cross-site case, but a cheap explicit header adds another intentional signal for the only cookie-dependent state-changing endpoints in the MVP. Other authenticated endpoints use bearer tokens and are not CSRF-vulnerable by construction.

**Alternatives considered**: A synchronizer token or double-submit token pattern would be stronger but unnecessary for the MVP because only two endpoints rely on ambient cookies and both are same-origin SPA calls.

## Decision: JWT signing

Sign JWTs with an asymmetric key, preferably RSA (`RS256`) for broad framework/tool compatibility.

**Rationale**: Asymmetric signing avoids sharing a symmetric HMAC secret between token issuer and validators and supports future key rotation with public key distribution. RSA is well-supported by ASP.NET Core and common tooling.

**Alternatives considered**: HMAC (`HS256`) was rejected by the plan constraint and because shared secrets are easier to leak or misuse. ECDSA is valid and compact but can add operational compatibility considerations; it can be revisited later.

## Decision: Tenant isolation strategy

Use both EF Core global query filters and PostgreSQL Row-Level Security.

**Rationale**: EF filters protect normal application queries and keep code readable. RLS enforces tenant isolation in the database if a repository/query accidentally omits the application filter. The backend sets `app.tenant_id` on each opened connection for authenticated tenant-scoped requests.

**Alternatives considered**: EF-only tenant filters were easier but insufficient for the constitutional requirement that leakage be technically difficult. Schema-per-tenant and database-per-tenant increase operational overhead and migration complexity for the MVP.

## Decision: Administrative and maintenance access

Use a separate database role for setup and maintenance paths that may bypass RLS, never the normal request role.

**Rationale**: Initial salon creation and future maintenance jobs can require cross-tenant or tenant-less operations, but those paths must be explicit and reviewed. Keeping a separate connection/role reduces accidental bypass in normal API code.

**Alternatives considered**: Disabling RLS conditionally in normal services was rejected because it makes accidental leaks likely. A separate admin service/process is possible later but unnecessary for the MVP.

## Decision: Time and timezone handling

Persist instants in UTC using PostgreSQL `timestamptz`; store each salon's timezone as an IANA zone string; keep domain scheduling calculations explicit about instants and local business rules.

**Rationale**: UTC storage avoids ambiguous persistence. IANA zones correctly model daylight-saving transitions for future regions even though Brazil currently has no DST. Business hours and weekly availability are local calendar rules for the salon; conversion happens at API/view boundaries and in application services when evaluating a local requested appointment against those rules.

**Alternatives considered**: Fixed `America/Sao_Paulo` everywhere matched the earlier spec text but conflicts with the latest technical architecture request. Local timestamps without zone were rejected because they create ambiguity and DST bugs. Domain-only UTC without local rule conversion cannot validate weekly schedules correctly.

## Decision: Service ownership model

Services belong to the salon tenant and are not linked to individual professionals.

**Rationale**: The requirement explicitly states that any active professional in the salon can execute any active service from the salon. Avoiding a `ProfessionalService` join keeps the MVP simpler and prevents unnecessary scheduling configuration overhead.

**Alternatives considered**: A `ProfessionalService` mapping table would support future specialization, but it is not required now and would complicate availability and CRUD flows without delivering current value.

## Decision: Client phone uniqueness

Enforce a unique constraint on `(TenantId, Phone)` for clients.

**Rationale**: Phone is the main operational identifier for salon staff. Tenant-scoped uniqueness prevents duplicate client records inside one salon while still allowing the same phone number to exist in different salons.

**Alternatives considered**: Global phone uniqueness would break multi-tenant isolation semantics. No uniqueness rule would allow duplicate operational records that confuse booking and history lookups.

## Decision: EF Core migrations workflow

Use EF Core migrations committed to source under `Agendella.Infrastructure/Migrations`.

**Rationale**: Migrations provide a clear development history and deployment artifact. In development, migrations are generated locally after model changes and applied to the local PostgreSQL database. In production, migrations should be applied deliberately during deployment, not implicitly on every API startup unless the deployment procedure explicitly gates it.

**Alternatives considered**: Manual SQL-only migrations offer more control but slow early development. Automatic `Database.Migrate()` on every production startup is convenient but can hide deployment failures and concurrency issues.

## Decision: Scheduling consistency

Use transaction-scoped revalidation plus database constraints/locks where appropriate.

**Rationale**: The spec requires the losing concurrent operation to be rejected at confirmation. Application validation alone is race-prone. PostgreSQL transactions should re-read relevant appointment/block/absence rows and rely on an exclusion constraint or equivalent locking strategy for non-overlapping appointment windows per tenant/professional where possible.

**Alternatives considered**: Optimistic UI validation was rejected because it cannot guarantee integrity. Serializing all scheduling per tenant would be simpler but unnecessarily restrictive. A PostgreSQL exclusion constraint using range types is strong and should be evaluated during implementation.

## Decision: Structured error format

Use one shared `ErrorResponse` shape for all 4xx/5xx responses and a richer `AppointmentConflictResponse` for scheduling `409`s.

**Rationale**: Staff users need clear conflict reasons and frontend code needs machine-readable failure types. A stable envelope keeps error handling consistent across API, UI, and tests.

**Alternatives considered**: Ad hoc per-endpoint errors were rejected because they create brittle client logic. A generic string-only error would be too weak for scheduling conflict UX.

## Decision: Input validation strategy

Use FluentValidation integrated globally in the ASP.NET Core pipeline and mapped into `ErrorResponse` with code `validation.failed`.

**Rationale**: FluentValidation keeps validation rules explicit, composable, and testable across DTOs that already have non-trivial scheduling, tenant, and security constraints. It also fits better than scattered controller checks when the API must return a consistent structured error payload with field-level details.

**Alternatives considered**: Data Annotations are simpler for trivial DTOs but become harder to organize and reuse once rules span time ranges, weekly schedules, conflict-related inputs, and role-specific request shapes.

## Decision: Pagination strategy

Use opaque cursor pagination with `pageSize` and `cursor` on all list endpoints.

**Rationale**: Cursor pagination is stable under concurrent writes and is a better long-term default for appointment and client lists than offset pagination.

**Alternatives considered**: Offset pagination is simpler but more fragile with inserts/deletes and can become expensive on large tables.

## Decision: Rate limiting

Use native ASP.NET Core rate limiting middleware with endpoint-specific policies.

**Rationale**: The platform already provides composable policies without an extra dependency. Login and refresh need stronger protections than normal authenticated traffic.

**Alternatives considered**: Reverse-proxy-only rate limiting would be useful in production but would not give application-level policy control or testability. A third-party rate limiting package was unnecessary.

## Decision: Frontend architecture

Use Angular standalone components, signals, services for state, route guards, and HTTP interceptors.

**Rationale**: The MVP needs predictable authenticated flows and mobile usability, not a large client state framework. Services plus signals are enough for auth state, agenda filters, loaded entities, and form state.

**Alternatives considered**: NgRx was rejected as unnecessary for MVP scope. A heavy UI framework was rejected to preserve a lightweight, custom mobile-first UI. Angular CDK remains acceptable for headless primitives.

## Decision: Frontend test framework

Use Vitest for frontend tests.

**Rationale**: Vitest aligns with current Angular team recommendations for modern projects, runs faster than Karma-based setups, and provides a better developer experience for watch mode, mocking, and local feedback loops.

**Alternatives considered**: Karma plus Jasmine is legacy, slower, and less pleasant for modern Angular workflows. Jest is viable but Vitest is the cleaner fit for the current tool direction and DX goals.

## Decision: REST contracts

Expose REST endpoints documented through OpenAPI/Swagger.

**Rationale**: REST fits CRUD plus action-style scheduling operations and aligns with ASP.NET Core defaults. OpenAPI supports frontend integration and manual validation without adding GraphQL complexity.

**Alternatives considered**: GraphQL was explicitly out of scope. gRPC is not ideal for browser-first SPA flows.

## Decision: Local development environment

Use native Ubuntu dependencies for development and Docker only for production deployment artifacts.

**Rationale**: This matches the requested workflow and keeps local iteration fast. Documentation must cover .NET SDK, Node/npm, PostgreSQL setup, connection strings, migrations, tests, and frontend dev server.

**Alternatives considered**: Docker Compose for local development was rejected by the user's constraint. Cloud-hosted development databases add operational dependency too early.

## Decision: Production deployment

Use VPS Docker deployment with nginx reverse proxy, Let's Encrypt HTTPS, same-host PostgreSQL, and daily external backups.

**Rationale**: The MVP target is a simple VPS and manual deploys are acceptable. Docker images make production runtime repeatable without imposing Docker on local development.

**Alternatives considered**: Managed Kubernetes, managed database, or full CI/CD were rejected as premature. They can be introduced later if the product grows.
