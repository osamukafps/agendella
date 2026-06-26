# Tasks: Salon Scheduling Core MVP

**Input**: Design documents from `specs/001-salon-scheduling-core/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Automated tests are required for tenant isolation, authorization, scheduling conflicts, availability, timezone, service duration, cancellation/remarcation, concurrency, unique client phone, CSRF, refresh-token rotation, rate limiting, and review-flagging rules.

**Organization**: Tasks follow the requested execution phases. Tasks tied to user-facing behavior include `[US1]`, `[US2]`, or `[US3]` labels so each story remains traceable and independently testable.

## Format

`- [ ] T### [P?] [US?] Description with exact file path (deps: T###, ...)`

## Story Map

- **US1**: Operar o salao completo as administradora.
- **US2**: Gerir a propria agenda as profissional.
- **US3**: Tratar pedidos de clientes internamente.

---

## Fase 0: Bootstrap Do Repositorio

**Goal**: Create the monorepo skeleton, .NET solution, Angular app, test tooling, and shared documentation entry points.

- [X] T001 Create backend and frontend root folders plus deployment and docs folders in `backend/`, `frontend/`, `deploy/`, and `docs/local-development.md` (deps: none)
- [X] T002 Initialize .NET solution and projects in `backend/Agendella.sln`, `backend/Agendella.Api/Agendella.Api.csproj`, `backend/Agendella.Application/Agendella.Application.csproj`, `backend/Agendella.Domain/Agendella.Domain.csproj`, `backend/Agendella.Infrastructure/Agendella.Infrastructure.csproj`, and `backend/Agendella.Tests/Agendella.Tests.csproj` (deps: T001)
- [X] T003 Configure .NET project references in `backend/Agendella.sln` and all `backend/Agendella.*/*.csproj` files so API depends on Application and Infrastructure, Application depends on Domain, Infrastructure depends on Domain and Application, and Tests reference all runtime projects (deps: T002)
- [X] T004 [P] Create initial ASP.NET Core API entry point with Swagger, controllers, health route placeholder, and environment loading in `backend/Agendella.Api/Program.cs` and `backend/Agendella.Api/appsettings.Development.json` (deps: T002)
- [X] T005 [P] Create Angular standalone application with routing and TailwindCSS scaffold in `frontend/package.json`, `frontend/angular.json`, `frontend/src/main.ts`, `frontend/src/styles.css`, and `frontend/tailwind.config.js` (deps: T001)
- [X] T006 [P] Configure Vitest for Angular frontend tests in `frontend/vitest.config.ts`, `frontend/src/test-setup.ts`, and `frontend/package.json` (deps: T005)
- [X] T007 [P] Configure backend xUnit test infrastructure and shared test naming conventions in `backend/Agendella.Tests/Agendella.Tests.csproj` and `backend/Agendella.Tests/GlobalUsings.cs` (deps: T002)
- [X] T008 [P] Add repository-level ignore and editor defaults for .NET, Angular, PostgreSQL local files, and deployment secrets in `.gitignore` and `.editorconfig` (deps: T001)
- [X] T009 Document native Ubuntu local prerequisites and baseline commands in `docs/local-development.md` (deps: T001)

**Checkpoint**: Repository skeleton, build projects, Angular app, and test harnesses exist.

---

## Fase 1: Infraestrutura Transversal

**Goal**: Configure PostgreSQL local development, connection management, migrations command path, environment configuration, and shared API primitives.

- [x] T010 Add backend configuration options for PostgreSQL, JWT keys, refresh cookies, CORS, frontend origin, rate limits, and logging in `backend/Agendella.Api/appsettings.json` and `backend/Agendella.Api/appsettings.Development.json` (deps: T004)
- [x] T011 Create strongly typed options classes in `backend/Agendella.Infrastructure/Configuration/DatabaseOptions.cs`, `backend/Agendella.Infrastructure/Auth/JwtOptions.cs`, `backend/Agendella.Infrastructure/Auth/RefreshCookieOptions.cs`, and `backend/Agendella.Api/Configuration/CorsOptions.cs` (deps: T010)
- [x] T012 Configure EF Core PostgreSQL package references and design-time factory in `backend/Agendella.Infrastructure/Agendella.Infrastructure.csproj` and `backend/Agendella.Infrastructure/Persistence/DesignTimeAgendellaDbContextFactory.cs` (deps: T003, T010)
- [x] T013 Create application error envelope and exception mapping primitives in `backend/Agendella.Application/Common/Errors/ApplicationError.cs`, `backend/Agendella.Application/Common/Errors/ErrorCodes.cs`, and `backend/Agendella.Api/Middleware/ErrorHandlingMiddleware.cs` (deps: T004)
- [x] T014 [P] Create API response contracts for structured errors and pagination in `backend/Agendella.Api/Contracts/Common/ErrorResponse.cs`, `backend/Agendella.Api/Contracts/Common/AppointmentConflictResponse.cs`, and `backend/Agendella.Api/Contracts/Common/PaginatedResponse.cs` (deps: T004)
- [x] T015 [P] Add backend integration test fixture for PostgreSQL connection strings and transactional cleanup in `backend/Agendella.Tests/Infrastructure/PostgresTestFixture.cs` (deps: T007, T012)
- [x] T016 [P] Add OpenAPI contract smoke test that validates structured 4xx/5xx responses exist in `backend/Agendella.Tests/Api/OpenApiContractTests.cs` (deps: T007, T014)
- [x] T017 Create local migration and database command documentation in `docs/local-development.md` (deps: T012)
- [x] T018 Configure FluentValidation globally and map validation failures into `ErrorResponse` with code `validation.failed` in `backend/Agendella.Api/Validation/ValidationConfiguration.cs`, `backend/Agendella.Api/Program.cs`, and `backend/Agendella.Api/Middleware/ErrorHandlingMiddleware.cs` (deps: T013, T014)
- [x] T019 [P] Add automated tests for global validation pipeline and `validation.failed` error formatting in `backend/Agendella.Tests/Api/ValidationPipelineTests.cs` (deps: T018, T015)

**Checkpoint**: Cross-cutting configuration, errors, pagination contracts, and database connectivity scaffolding are ready.

---

## Fase 2: Modelo De Dominio E Persistencia

**Goal**: Implement domain entities, value objects, DbContext, initial migrations, indexes, and persistence mappings.

- [ ] T020 [P] Implement shared domain primitives in `backend/Agendella.Domain/Common/Entity.cs`, `backend/Agendella.Domain/Common/ITenantEntity.cs`, `backend/Agendella.Domain/Common/DateTimeRange.cs`, and `backend/Agendella.Domain/Common/LocalTimeRange.cs` (deps: T003)
- [ ] T021 [P] Implement salon aggregate entities in `backend/Agendella.Domain/Entities/SalonTenant.cs` and `backend/Agendella.Domain/Entities/SalonBusinessHour.cs` (deps: T020)
- [ ] T022 [P] Implement collaborator and refresh-token session entities in `backend/Agendella.Domain/Entities/SalonCollaborator.cs` and `backend/Agendella.Domain/Entities/RefreshTokenSession.cs` (deps: T020)
- [ ] T023 [P] Implement professional and weekly availability entities in `backend/Agendella.Domain/Entities/Professional.cs` and `backend/Agendella.Domain/Entities/ProfessionalWeeklyAvailability.cs` (deps: T020)
- [ ] T024 [P] Implement service entity with tenant-owned service model in `backend/Agendella.Domain/Entities/Service.cs` (deps: T020)
- [ ] T025 [P] Implement client entity with tenant-scoped phone uniqueness metadata in `backend/Agendella.Domain/Entities/Client.cs` (deps: T020)
- [ ] T026 [P] Implement appointment, salon block, professional absence, and client history event entities in `backend/Agendella.Domain/Entities/Appointment.cs`, `backend/Agendella.Domain/Entities/SalonBlock.cs`, `backend/Agendella.Domain/Entities/ProfessionalAbsence.cs`, and `backend/Agendella.Domain/Entities/ClientHistoryEvent.cs` (deps: T020)
- [ ] T027 [P] Add domain enum definitions in `backend/Agendella.Domain/Enums/SalonStatus.cs`, `backend/Agendella.Domain/Enums/CollaboratorRole.cs`, `backend/Agendella.Domain/Enums/RecordStatus.cs`, `backend/Agendella.Domain/Enums/AppointmentStatus.cs`, and `backend/Agendella.Domain/Enums/ClientHistoryEventType.cs` (deps: T020)
- [ ] T028 Implement `AgendellaDbContext` with DbSets and entity configurations in `backend/Agendella.Infrastructure/Persistence/AgendellaDbContext.cs` and `backend/Agendella.Infrastructure/Persistence/Configurations/*.cs` (deps: T021, T022, T023, T024, T025, T026, T027)
- [ ] T029 Add EF configuration for unique index `(TenantId, Phone)` on clients and unique collaborator email per tenant in `backend/Agendella.Infrastructure/Persistence/Configurations/ClientConfiguration.cs` and `backend/Agendella.Infrastructure/Persistence/Configurations/SalonCollaboratorConfiguration.cs` (deps: T028)
- [ ] T030 Add EF migration for initial schema and indexes in `backend/Agendella.Infrastructure/Migrations/*_InitialCreate.cs` and `backend/Agendella.Infrastructure/Migrations/AgendellaDbContextModelSnapshot.cs` (deps: T028, T029)
- [ ] T031 [P] Add entity mapping tests for required fields and indexes in `backend/Agendella.Tests/Infrastructure/EntityMappingTests.cs` (deps: T028, T029)
- [ ] T032 [P] Add automated test for unique client phone per tenant in `backend/Agendella.Tests/Infrastructure/ClientPhoneUniquenessTests.cs` (deps: T025, T029, T015)
- [ ] T033 Add seed helper for pilot tenant with `America/Sao_Paulo` timezone in `backend/Agendella.Infrastructure/Persistence/Seed/PilotTenantSeed.cs` (deps: T028)

**Checkpoint**: Domain model, EF mappings, initial schema, and critical uniqueness tests are ready.

---

## Fase 3: Multi-Tenant

**Goal**: Resolve tenant context, apply default EF scoping, enforce RLS in PostgreSQL, and isolate administrative setup paths.

- [ ] T034 Implement tenant context abstraction and request-scoped accessor in `backend/Agendella.Application/Tenancy/ITenantContext.cs` and `backend/Agendella.Api/Tenancy/HttpTenantContext.cs` (deps: T013, T028)
- [ ] T035 Add tenant resolution middleware from JWT claims and request context in `backend/Agendella.Api/Middleware/TenantResolutionMiddleware.cs` and `backend/Agendella.Api/Program.cs` (deps: T034)
- [ ] T036 Implement EF Core global query filters for every tenant entity in `backend/Agendella.Infrastructure/Persistence/AgendellaDbContext.cs` (deps: T034, T028)
- [ ] T037 Add database connection interceptor that sets PostgreSQL session GUC `app.tenant_id` for normal requests in `backend/Agendella.Infrastructure/Persistence/TenantSessionInterceptor.cs` (deps: T034)
- [ ] T038 Add RLS migration for all tenant tables in `backend/Agendella.Infrastructure/Migrations/*_EnableTenantRls.cs` (deps: T030, T037)
- [ ] T039 Add separate administrative database role migration and configuration notes in `backend/Agendella.Infrastructure/Migrations/*_AdministrativeRole.cs` and `docs/local-development.md` (deps: T038)
- [ ] T040 [P] Add automated test for EF global query filters blocking cross-tenant reads in `backend/Agendella.Tests/Infrastructure/TenantQueryFilterTests.cs` (deps: T036, T015)
- [ ] T041 [P] Add automated test for PostgreSQL RLS blocking cross-tenant reads when EF filter is bypassed in `backend/Agendella.Tests/Infrastructure/TenantRlsTests.cs` (deps: T038, T015)
- [ ] T042 [P] Add automated test that direct lookup of another tenant returns not found in `backend/Agendella.Tests/Application/TenantLookupSecurityTests.cs` (deps: T036, T038)

**Checkpoint**: Tenant scoping is enforced in application and database layers.

---

## Fase 4: Autenticacao E Autorizacao

**Goal**: Implement login, RS256 JWTs, rotating refresh tokens in secure cookies, `/me`, role policies, backend authorization, and frontend role primitives.

- [ ] T043 [P] Add automated test for explicit CORS policy allowing `http://localhost:4200` with credentials and rejecting unknown origins in `backend/Agendella.Tests/Api/CorsPolicyTests.cs` (deps: T010, T015)
- [ ] T044 Configure explicit CORS policy with allowed origins, credentials, restricted methods, restricted headers, and no wildcard in `backend/Agendella.Api/Configuration/CorsConfiguration.cs` and `backend/Agendella.Api/Program.cs` (deps: T043, T010)
- [ ] T045 Implement password hashing and credential verification services in `backend/Agendella.Infrastructure/Auth/PasswordHasher.cs` and `backend/Agendella.Application/Auth/CredentialService.cs` (deps: T022, T028)
- [ ] T046 Create pilot-tenant administradora seed using env-sourced password and `PasswordHasher`, and document the env variable in `backend/Agendella.Infrastructure/Persistence/Seed/PilotAdminSeed.cs` and `docs/local-development.md` (deps: T033, T045)
- [ ] T047 Implement RSA key loading and RS256 JWT access-token issuer in `backend/Agendella.Infrastructure/Auth/JwtTokenService.cs` (deps: T011, T022)
- [ ] T048 Implement refresh-token generation, hashing, rotation, reuse detection, and revocation in `backend/Agendella.Application/Auth/RefreshTokenService.cs` and `backend/Agendella.Infrastructure/Auth/RefreshTokenRepository.cs` (deps: T022, T028)
- [ ] T049 Implement refresh cookie writer and clearer with `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/auth` in `backend/Agendella.Api/Auth/RefreshCookieWriter.cs` (deps: T011, T048)
- [ ] T050 Implement CSRF header validation for `/auth/refresh` and `/auth/logout` in `backend/Agendella.Api/Middleware/CsrfProtectionMiddleware.cs` and `backend/Agendella.Api/Program.cs` (deps: T049)
- [ ] T051 Implement auth controller endpoints `/auth/login`, `/auth/refresh`, `/auth/logout`, and `/me` in `backend/Agendella.Api/Controllers/AuthController.cs` and `backend/Agendella.Api/Contracts/Auth/*.cs` (deps: T045, T047, T048, T049, T050)
- [ ] T052 [P] Add automated tests for login and refresh input validation in `backend/Agendella.Tests/Api/AuthValidationTests.cs` (deps: T019, T051)
- [ ] T053 Implement FluentValidation validators for auth login and refresh inputs in `backend/Agendella.Api/Validators/Auth/LoginRequestValidator.cs` and `backend/Agendella.Api/Validators/Auth/RefreshRequestValidator.cs` (deps: T018)
- [ ] T054 Implement server authorization policies for administradora and profissional scopes in `backend/Agendella.Api/Auth/AuthorizationPolicies.cs` and `backend/Agendella.Api/Program.cs` (deps: T051)
- [ ] T055 [P] Add automated tests for RS256 JWT claims and tenant/role claims in `backend/Agendella.Tests/Infrastructure/JwtTokenServiceTests.cs` (deps: T047)
- [ ] T056 [P] Add automated tests for refresh-token rotation, reuse revocation, cookie attributes, and logout clearing in `backend/Agendella.Tests/Api/AuthRefreshTokenTests.cs` (deps: T048, T049, T051)
- [ ] T057 [P] Add automated tests for CSRF rejection on `/auth/refresh` and `/auth/logout` in `backend/Agendella.Tests/Api/AuthCsrfTests.cs` (deps: T050, T051)
- [ ] T058 [P] Add automated tests for role policies denying professional access to admin actions in `backend/Agendella.Tests/Api/AuthorizationPolicyTests.cs` (deps: T054)
- [ ] T059 [P] Create frontend auth types and route role metadata in `frontend/src/app/core/auth/auth.models.ts` and `frontend/src/app/core/auth/role-policy.ts` (deps: T005)

**Checkpoint**: Backend auth and authorization are usable and tested; frontend has shared auth types for later UI phases.

---

## Fase 5: Cadastros Basicos Do Tenant

**Goal**: Implement salon settings, business hours, services, professionals, weekly availability, clients, client history access, and cursor-paginated list endpoints.

**Independent Test Criteria**: An administradora can configure salon profile, business hours, services, professionals, weekly availability, and clients inside the active tenant; a professional cannot perform forbidden admin actions; duplicate client phone in the same tenant returns conflict.

- [ ] T060 [P] [US1] Add API contract tests for `/salon` and `/salon/business-hours` in `backend/Agendella.Tests/Api/SalonContractsTests.cs` (deps: T051, T054)
- [ ] T061 [P] [US1] Add API contract tests for `/services`, `/services/{id}`, and `/services/{id}/deactivate` in `backend/Agendella.Tests/Api/ServicesContractsTests.cs` (deps: T051, T054)
- [ ] T062 [P] [US1] Add API contract tests for `/professionals`, `/professionals/{id}`, `/professionals/{id}/deactivate`, and `/professionals/{id}/weekly-availability` in `backend/Agendella.Tests/Api/ProfessionalsContractsTests.cs` (deps: T051, T054)
- [ ] T063 [P] [US1] Add API contract tests for `/clients`, `/clients/{id}`, `/clients/{id}/deactivate`, and `/clients/{id}/history` in `backend/Agendella.Tests/Api/ClientsContractsTests.cs` (deps: T051, T054)
- [ ] T064 [P] [US1] Add automated test for duplicate client phone conflict code `client.phone.duplicate` in `backend/Agendella.Tests/Application/ClientUniquenessServiceTests.cs` (deps: T032)
- [ ] T065 [P] [US1] Add automated authorization tests for administradora-only salon, service, professional, and business-hour mutations in `backend/Agendella.Tests/Api/AdminCadastroAuthorizationTests.cs` (deps: T054)
- [ ] T066 [P] [US1] Add automated tests for salon, business-hours, service, professional, and client DTO validation in `backend/Agendella.Tests/Api/CadastroValidationTests.cs` (deps: T019)
- [ ] T067 [US1] Implement FluentValidation validators for salon, business-hours, service, professional, and client DTOs in `backend/Agendella.Api/Validators/Salons/*.cs`, `backend/Agendella.Api/Validators/Services/*.cs`, `backend/Agendella.Api/Validators/Professionals/*.cs`, and `backend/Agendella.Api/Validators/Clients/*.cs` (deps: T018)
- [ ] T068 [US1] Implement salon settings use cases in `backend/Agendella.Application/Salons/SalonSettingsService.cs` (deps: T021, T028, T036, T054)
- [ ] T069 [US1] Implement business-hours validation and replacement use cases in `backend/Agendella.Application/Salons/BusinessHoursService.cs` (deps: T021, T028, T036, T054)
- [ ] T070 [US1] Implement service CRUD, deactivation, tenant-owned service validation, and cursor pagination in `backend/Agendella.Application/Services/ServiceCatalogService.cs` (deps: T024, T028, T036, T054)
- [ ] T071 [US1] Implement professional CRUD, deactivation, and cursor pagination in `backend/Agendella.Application/Professionals/ProfessionalManagementService.cs` (deps: T023, T028, T036, T054)
- [ ] T072 [US1] Implement weekly availability get/replace use cases with admin and self-professional rules in `backend/Agendella.Application/Professionals/WeeklyAvailabilityService.cs` (deps: T023, T028, T036, T054)
- [ ] T073 [US1] Implement client CRUD, deactivation, duplicate phone handling, history read scoping, and cursor pagination in `backend/Agendella.Application/Clients/ClientManagementService.cs` (deps: T025, T026, T028, T036, T054)
- [ ] T074 [US1] Implement salon controller endpoints in `backend/Agendella.Api/Controllers/SalonController.cs` and `backend/Agendella.Api/Contracts/Salons/*.cs` (deps: T068, T069)
- [ ] T075 [US1] Implement services controller endpoints in `backend/Agendella.Api/Controllers/ServicesController.cs` and `backend/Agendella.Api/Contracts/Services/*.cs` (deps: T070)
- [ ] T076 [US1] Implement professionals controller endpoints in `backend/Agendella.Api/Controllers/ProfessionalsController.cs` and `backend/Agendella.Api/Contracts/Professionals/*.cs` (deps: T071, T072)
- [ ] T077 [US1] Implement clients controller endpoints in `backend/Agendella.Api/Controllers/ClientsController.cs` and `backend/Agendella.Api/Contracts/Clients/*.cs` (deps: T073)
- [ ] T078 [P] [US1] Add integration test for administradora configuring salon, business hours, service, professional, availability, and client in `backend/Agendella.Tests/Api/AdminCadastroJourneyTests.cs` (deps: T074, T075, T076, T077)
- [ ] T079 [P] [US2] Add integration test for profissional creating/updating client but failing admin-only cadastro operations in `backend/Agendella.Tests/Api/ProfessionalCadastroScopeTests.cs` (deps: T073, T077)
- [ ] T080 [P] [US3] Add integration test for client history read scoping by administradora and profissional in `backend/Agendella.Tests/Api/ClientHistoryScopeTests.cs` (deps: T073, T077)

**Checkpoint**: Tenant cadastros are API-complete and independently testable for admin and professional scopes.

---

## Fase 6: Nucleo De Agendamento

**Goal**: Implement availability search, appointment creation, rescheduling, cancellation, complete, no-show, review resolution, transactional conflict prevention, and exclusion constraint.

**Independent Test Criteria**: Valid appointments can be created and rescheduled; invalid windows are rejected with structured `AppointmentConflictResponse`; concurrent overlapping operations leave exactly one winner; completion/no-show/cancellation generate client history.

- [ ] T081 [P] [US1] Add automated test for appointment overlap rejection and consecutive appointment allowance in `backend/Agendella.Tests/Domain/AppointmentConflictRulesTests.cs` (deps: T026)
- [ ] T082 [P] [US1] Add automated test for manual end overriding service duration and rejecting end before or equal start in `backend/Agendella.Tests/Domain/AppointmentDurationRulesTests.cs` (deps: T026)
- [ ] T083 [P] [US1] Add automated test for availability order salon hours, professional availability, blocks, absences, and appointment conflict in `backend/Agendella.Tests/Domain/AvailabilityPrecedenceTests.cs` (deps: T021, T023, T026)
- [ ] T084 [P] [US1] Add automated test for IANA timezone conversion and DST-safe local schedule evaluation in `backend/Agendella.Tests/Domain/TimezoneSchedulingTests.cs` (deps: T021, T023, T026)
- [ ] T085 [P] [US1] Add integration test for concurrent appointment create/reschedule losing operation rejection in `backend/Agendella.Tests/Infrastructure/AppointmentConcurrencyTests.cs` (deps: T015, T026)
- [ ] T086 [P] [US1] Add API contract tests for `/availability`, `/appointments`, `/appointments/{id}/reschedule`, `/appointments/{id}/cancel`, `/appointments/{id}/complete`, `/appointments/{id}/no-show`, and `/appointments/{id}/resolve-review` in `backend/Agendella.Tests/Api/AppointmentsContractsTests.cs` (deps: T051, T054)
- [ ] T087 [P] [US1] Add automated tests for appointment and availability DTO validation in `backend/Agendella.Tests/Api/SchedulingValidationTests.cs` (deps: T019)
- [ ] T088 [US1] Implement FluentValidation validators for availability and appointment DTOs in `backend/Agendella.Api/Validators/Appointments/*.cs` and `backend/Agendella.Api/Validators/Availability/*.cs` (deps: T018)
- [ ] T089 [US1] Implement appointment window and conflict domain services in `backend/Agendella.Domain/Scheduling/AppointmentWindow.cs` and `backend/Agendella.Domain/Scheduling/AppointmentConflictRules.cs` (deps: T081, T082)
- [ ] T090 [US1] Implement availability evaluation domain service in `backend/Agendella.Domain/Scheduling/AvailabilityEvaluator.cs` (deps: T083, T084, T089)
- [ ] T091 [US1] Add PostgreSQL exclusion constraint for non-overlapping scheduled appointment ranges per tenant/professional in `backend/Agendella.Infrastructure/Migrations/*_AppointmentExclusionConstraint.cs` (deps: T030, T089)
- [ ] T092 [US1] Implement appointment repository with transaction-scoped revalidation and conflict details in `backend/Agendella.Infrastructure/Repositories/AppointmentRepository.cs` (deps: T090, T091)
- [ ] T093 [US1] Implement availability search use case in `backend/Agendella.Application/Scheduling/AvailabilityService.cs` (deps: T090, T092)
- [ ] T094 [US1] Implement create and reschedule appointment use cases with structured conflict codes in `backend/Agendella.Application/Scheduling/AppointmentSchedulingService.cs` (deps: T092)
- [ ] T095 [US1] Implement administradora cancel/remarcar override logic and client-history event writes in `backend/Agendella.Application/Scheduling/AppointmentCancellationService.cs` (deps: T094, T073)
- [ ] T096 [US3] Implement complete and no-show use cases with `ClientHistoryEvent` creation in `backend/Agendella.Application/Scheduling/AppointmentOutcomeService.cs` (deps: T094, T073)
- [ ] T097 [US1] Implement review resolution use case and `ReviewResolved` history event in `backend/Agendella.Application/Scheduling/AppointmentReviewService.cs` (deps: T094, T073)
- [ ] T098 [US1] Implement appointments and availability controllers in `backend/Agendella.Api/Controllers/AppointmentsController.cs`, `backend/Agendella.Api/Controllers/AvailabilityController.cs`, and `backend/Agendella.Api/Contracts/Appointments/*.cs` (deps: T093, T094, T095, T096, T097)
- [ ] T099 [P] [US1] Add integration test for administradora creating, rescheduling, cancelling, completing, no-showing, and resolving review on appointments in `backend/Agendella.Tests/Api/AdminAppointmentJourneyTests.cs` (deps: T098)
- [ ] T100 [P] [US2] Add integration test for profissional operating only own appointments and respecting cancellation window in `backend/Agendella.Tests/Api/ProfessionalAppointmentScopeTests.cs` (deps: T095, T098)
- [ ] T101 [P] [US3] Add integration test for availability search returning empty with clear unavailability and no invalid slots in `backend/Agendella.Tests/Api/AvailabilitySearchTests.cs` (deps: T093, T098)

**Checkpoint**: Scheduling core is consistent, transactional, API-complete, and tested for critical rules.

---

## Fase 7: Bloqueios Do Salao E Ausencias Da Profissional

**Goal**: Implement salon blocks, professional absences, absence cancellation, and automatic `RequiresReview` marking for affected appointments.

**Independent Test Criteria**: Blocks and absences prevent new appointments, preserve existing appointments, and mark affected appointments with visible review reason until manual resolution.

- [ ] T102 [P] [US1] Add automated test for salon block overlapping existing appointments marking `RequiresReview` in `backend/Agendella.Tests/Application/SalonBlockReviewTests.cs` (deps: T094)
- [ ] T103 [P] [US2] Add automated test for professional absence overlapping existing appointments marking `RequiresReview` in `backend/Agendella.Tests/Application/ProfessionalAbsenceReviewTests.cs` (deps: T094)
- [ ] T104 [P] [US2] Add authorization test for professional absence create/cancel only on own professional record in `backend/Agendella.Tests/Api/ProfessionalAbsenceAuthorizationTests.cs` (deps: T054)
- [ ] T105 [P] [US1] Add API contract tests for `GET/POST /salon-blocks`, `DELETE /salon-blocks/{id}`, `GET /professionals/{id}/absences`, `POST /professional-absences`, and `POST /professionals/{id}/absences/{absenceId}/cancel` in `backend/Agendella.Tests/Api/BlocksAndAbsencesContractsTests.cs` (deps: T051, T054)
- [ ] T106 [P] [US1] Add automated tests for salon block DTO validation in `backend/Agendella.Tests/Api/SalonBlockValidationTests.cs` (deps: T019)
- [ ] T107 [US1] Implement FluentValidation validators for salon block DTOs in `backend/Agendella.Api/Validators/SalonBlocks/*.cs` (deps: T018)
- [ ] T108 [P] [US2] Add automated tests for professional absence DTO validation in `backend/Agendella.Tests/Api/ProfessionalAbsenceValidationTests.cs` (deps: T019)
- [ ] T109 [US2] Implement FluentValidation validators for professional absence DTOs in `backend/Agendella.Api/Validators/ProfessionalAbsences/*.cs` (deps: T018)
- [ ] T110 [US1] Implement salon block create/list/delete use cases and affected-appointment review marking in `backend/Agendella.Application/Scheduling/SalonBlockService.cs` (deps: T102, T092)
- [ ] T111 [US2] Implement professional absence create/list/cancel use cases and affected-appointment review marking in `backend/Agendella.Application/Scheduling/ProfessionalAbsenceService.cs` (deps: T103, T104, T092)
- [ ] T112 [US1] Implement salon blocks controller in `backend/Agendella.Api/Controllers/SalonBlocksController.cs` and `backend/Agendella.Api/Contracts/SalonBlocks/*.cs` (deps: T110)
- [ ] T113 [US2] Implement professional absences endpoints in `backend/Agendella.Api/Controllers/ProfessionalAbsencesController.cs` and `backend/Agendella.Api/Contracts/ProfessionalAbsences/*.cs` (deps: T111)
- [ ] T114 [P] [US1] Add integration test for block creation preserving existing appointments and blocking new bookings in `backend/Agendella.Tests/Api/SalonBlockJourneyTests.cs` (deps: T112, T098)
- [ ] T115 [P] [US2] Add integration test for absence creation/cancellation preserving existing appointments and blocking/unblocking new bookings in `backend/Agendella.Tests/Api/ProfessionalAbsenceJourneyTests.cs` (deps: T113, T098)

**Checkpoint**: Blocks and absences are enforceable and review-safe.

---

## Fase 8: Frontend Shell Autenticado

**Goal**: Implement login, refresh, responsive app shell, bearer interceptor, route guards, and role-aware navigation.

**Independent Test Criteria**: A collaborator can log in on mobile, receive access token in app state, refresh silently via cookie, navigate protected routes by role, and log out cleanly.

- [ ] T116 [P] [US1] Add Vitest tests for auth service login/refresh/logout state transitions in `frontend/src/app/core/auth/auth.service.spec.ts` (deps: T006, T059)
- [ ] T117 [P] [US1] Add Vitest tests for HTTP bearer interceptor and refresh retry behavior in `frontend/src/app/core/http/auth.interceptor.spec.ts` (deps: T006, T059)
- [ ] T118 [P] [US1] Add Vitest tests for role guards and mobile shell navigation visibility in `frontend/src/app/core/auth/auth.guard.spec.ts` and `frontend/src/app/core/layout/app-shell.component.spec.ts` (deps: T006, T059)
- [ ] T119 [US1] Implement frontend API environment and generated contract-compatible core models in `frontend/src/environments/environment.ts` and `frontend/src/app/core/api/api.models.ts` (deps: T005)
- [ ] T120 [US1] Implement auth API client with cookie-based refresh and `X-CSRF-Protection: 1` header in `frontend/src/app/core/auth/auth-api.service.ts` (deps: T119)
- [ ] T121 [US1] Implement auth state service using signals in `frontend/src/app/core/auth/auth.service.ts` (deps: T116, T120)
- [ ] T122 [US1] Implement bearer token interceptor and refresh retry flow in `frontend/src/app/core/http/auth.interceptor.ts` (deps: T117, T121)
- [ ] T123 [US1] Implement route guards for authenticated, administradora, and profissional routes in `frontend/src/app/core/auth/auth.guard.ts` and `frontend/src/app/app.routes.ts` (deps: T118, T121)
- [ ] T124 [US1] Implement responsive app shell and role-aware navigation in `frontend/src/app/core/layout/app-shell.component.ts`, `frontend/src/app/core/layout/app-shell.component.html`, and `frontend/src/app/core/layout/app-shell.component.css` (deps: T118, T123)
- [ ] T125 [US1] Implement login page with mobile-first layout in `frontend/src/app/features/auth/login-page.component.ts`, `frontend/src/app/features/auth/login-page.component.html`, and `frontend/src/app/features/auth/login-page.component.css` (deps: T121, T124)

**Checkpoint**: Authenticated frontend shell is ready for feature screens.

---

## Fase 9: Frontend Telas De Cadastro Do Tenant

**Goal**: Implement salon settings, business hours, services, professionals, weekly availability, and clients screens.

**Independent Test Criteria**: Administradora can configure core tenant data from mobile and desktop; profissional sees only allowed client and self-availability operations.

- [ ] T126 [P] [US1] Add Vitest tests for salon settings and business-hours forms in `frontend/src/app/features/salon-settings/salon-settings-page.component.spec.ts` (deps: T006, T124)
- [ ] T127 [P] [US1] Add Vitest tests for services list/form and service deactivation behavior in `frontend/src/app/features/services/services-page.component.spec.ts` (deps: T006, T124)
- [ ] T128 [P] [US1] Add Vitest tests for professionals and weekly availability screens in `frontend/src/app/features/professionals/professionals-page.component.spec.ts` (deps: T006, T124)
- [ ] T129 [P] [US1] Add Vitest tests for clients list/form duplicate-phone error display in `frontend/src/app/features/clients/clients-page.component.spec.ts` (deps: T006, T124)
- [ ] T130 [US1] Implement salon settings API client and page in `frontend/src/app/features/salon-settings/salon-settings-api.service.ts`, `frontend/src/app/features/salon-settings/salon-settings-page.component.ts`, and `frontend/src/app/features/salon-settings/salon-settings-page.component.html` (deps: T126, T122)
- [ ] T131 [US1] Implement services API client and page in `frontend/src/app/features/services/services-api.service.ts`, `frontend/src/app/features/services/services-page.component.ts`, and `frontend/src/app/features/services/services-page.component.html` (deps: T127, T122)
- [ ] T132 [US1] Implement professionals API client, page, and weekly availability editor in `frontend/src/app/features/professionals/professionals-api.service.ts`, `frontend/src/app/features/professionals/professionals-page.component.ts`, and `frontend/src/app/features/professionals/weekly-availability-editor.component.ts` (deps: T128, T122)
- [ ] T133 [US1] Implement clients API client and admin client page in `frontend/src/app/features/clients/clients-api.service.ts`, `frontend/src/app/features/clients/clients-page.component.ts`, and `frontend/src/app/features/clients/clients-page.component.html` (deps: T129, T122)
- [ ] T134 [US2] Implement professional self availability route using the shared weekly availability editor in `frontend/src/app/features/professionals/my-availability-page.component.ts` and `frontend/src/app/app.routes.ts` (deps: T132, T123)
- [ ] T135 [US2] Implement professional allowed client create/update UI in `frontend/src/app/features/clients/client-quick-form.component.ts` and `frontend/src/app/features/clients/clients-api.service.ts` (deps: T133)

**Checkpoint**: Tenant cadastro screens are usable and role-scoped in the SPA.

---

## Fase 10: Frontend Agenda E Fluxo De Marcacao

**Goal**: Implement agenda views, availability search, create/reschedule/cancel appointment, complete/no-show, and review resolution UI.

**Independent Test Criteria**: Administradora and profissional complete booking, remarcation, cancellation, complete/no-show, and review-resolution flows within mobile-first UI constraints and see clear conflict errors.

- [ ] T136 [P] [US1] Add Vitest tests for agenda data service and cursor pagination in `frontend/src/app/features/agenda/agenda-api.service.spec.ts` (deps: T006, T124)
- [ ] T137 [P] [US1] Add Vitest tests for availability search and conflict error rendering in `frontend/src/app/features/agenda/availability-picker.component.spec.ts` (deps: T006, T124)
- [ ] T138 [P] [US1] Add Vitest tests for appointment create/reschedule/cancel forms in `frontend/src/app/features/agenda/appointment-form.component.spec.ts` (deps: T006, T124)
- [ ] T139 [P] [US3] Add Vitest tests for complete/no-show/review resolution actions in `frontend/src/app/features/agenda/appointment-actions.component.spec.ts` (deps: T006, T124)
- [ ] T140 [US1] Implement agenda API client for appointments and availability in `frontend/src/app/features/agenda/agenda-api.service.ts` (deps: T136, T122)
- [ ] T141 [US1] Implement responsive agenda day/week/professional view in `frontend/src/app/features/agenda/agenda-page.component.ts`, `frontend/src/app/features/agenda/agenda-page.component.html`, and `frontend/src/app/features/agenda/agenda-page.component.css` (deps: T140, T137)
- [ ] T142 [US3] Implement availability picker with no-slot state and structured conflict display in `frontend/src/app/features/agenda/availability-picker.component.ts` and `frontend/src/app/features/agenda/availability-picker.component.html` (deps: T137, T140)
- [ ] T143 [US1] Implement appointment create/reschedule/cancel form in `frontend/src/app/features/agenda/appointment-form.component.ts` and `frontend/src/app/features/agenda/appointment-form.component.html` (deps: T138, T142)
- [ ] T144 [US3] Implement complete, no-show, and resolve-review actions in `frontend/src/app/features/agenda/appointment-actions.component.ts` and `frontend/src/app/features/agenda/appointment-actions.component.html` (deps: T139, T140)
- [ ] T145 [US2] Implement professional own-agenda route filtering and permissions in `frontend/src/app/features/agenda/my-agenda-page.component.ts` and `frontend/src/app/app.routes.ts` (deps: T141, T123)
- [ ] T146 [US1] Wire agenda routes into shell navigation in `frontend/src/app/app.routes.ts` and `frontend/src/app/core/layout/app-shell.component.ts` (deps: T141, T143, T144, T145)

**Checkpoint**: Agenda and booking flows are available in the SPA for all MVP roles.

---

## Fase 11: Frontend Cliente E Historico, Blocos E Ausencias

**Goal**: Implement client history views, salon block screens, professional absence screens, and review-state visibility.

**Independent Test Criteria**: Administradora sees tenant client history, profissional sees only own related history, blocks/absences can be managed by allowed roles, and affected appointments show review status.

- [ ] T147 [P] [US3] Add Vitest tests for client history scoping UI states in `frontend/src/app/features/clients/client-history-page.component.spec.ts` (deps: T006, T124)
- [ ] T148 [P] [US1] Add Vitest tests for salon block list/create/delete UI in `frontend/src/app/features/blocks/salon-blocks-page.component.spec.ts` (deps: T006, T124)
- [ ] T149 [P] [US2] Add Vitest tests for professional absence list/create/cancel UI in `frontend/src/app/features/absences/professional-absences-page.component.spec.ts` (deps: T006, T124)
- [ ] T150 [P] [US1] Add Vitest tests for visible `requiresReview` badge and review reason in agenda cards in `frontend/src/app/features/agenda/appointment-card.component.spec.ts` (deps: T006, T141)
- [ ] T151 [US3] Implement client history API and page in `frontend/src/app/features/clients/client-history-api.service.ts`, `frontend/src/app/features/clients/client-history-page.component.ts`, and `frontend/src/app/features/clients/client-history-page.component.html` (deps: T147, T133)
- [ ] T152 [US1] Implement salon blocks API and page in `frontend/src/app/features/blocks/salon-blocks-api.service.ts`, `frontend/src/app/features/blocks/salon-blocks-page.component.ts`, and `frontend/src/app/features/blocks/salon-blocks-page.component.html` (deps: T148, T122)
- [ ] T153 [US2] Implement professional absences API and page in `frontend/src/app/features/absences/professional-absences-api.service.ts`, `frontend/src/app/features/absences/professional-absences-page.component.ts`, and `frontend/src/app/features/absences/professional-absences-page.component.html` (deps: T149, T122)
- [ ] T154 [US1] Implement appointment card review badge and reason display in `frontend/src/app/features/agenda/appointment-card.component.ts` and `frontend/src/app/features/agenda/appointment-card.component.html` (deps: T150, T141)
- [ ] T155 [US1] Wire client history, blocks, absences, and review routes into navigation in `frontend/src/app/app.routes.ts` and `frontend/src/app/core/layout/app-shell.component.ts` (deps: T151, T152, T153, T154)

**Checkpoint**: Client history, blocks, absences, and review visibility are represented in the SPA.

---

## Fase 12: Rate Limiting, Hardening, Logs Estruturados, Healthcheck

**Goal**: Add operational hardening, privacy-safe structured logging, health checks, OpenAPI completeness, and final quickstart validation.

- [ ] T156 [P] Add automated tests for `/auth/login`, `/auth/refresh`, and authenticated endpoint rate limit policies in `backend/Agendella.Tests/Api/RateLimitingTests.cs` (deps: T051)
- [ ] T157 [P] Add automated tests that structured logs include tenant id but avoid customer PII leakage in `backend/Agendella.Tests/Api/StructuredLoggingPrivacyTests.cs` (deps: T013, T035)
- [ ] T158 [P] Add automated healthcheck tests for API and PostgreSQL readiness in `backend/Agendella.Tests/Api/HealthCheckTests.cs` (deps: T012)
- [ ] T159 Implement ASP.NET Core rate limiting policies and `429` structured responses in `backend/Agendella.Api/Configuration/RateLimitingConfiguration.cs` and `backend/Agendella.Api/Program.cs` (deps: T156)
- [ ] T160 Implement privacy-safe structured logging enrichment with tenant, collaborator, correlation id, and request metadata in `backend/Agendella.Api/Middleware/RequestLoggingMiddleware.cs` and `backend/Agendella.Api/Program.cs` (deps: T157)
- [ ] T161 Implement API and PostgreSQL health checks in `backend/Agendella.Api/Health/DatabaseHealthCheck.cs` and `backend/Agendella.Api/Program.cs` (deps: T158)
- [ ] T162 [P] Update OpenAPI generation metadata and verify all 4xx/5xx responses reference `ErrorResponse` in `backend/Agendella.Api/Program.cs` and `specs/001-salon-scheduling-core/contracts/openapi.yaml` (deps: T014, T098, T112, T113)
- [ ] T163 [P] Add backend quickstart validation script commands to `docs/local-development.md` (deps: T159, T160, T161)
- [ ] T164 [P] Add frontend responsive smoke tests for mobile viewport critical flows in `frontend/src/app/app.responsive.spec.ts` (deps: T125, T146, T155)

**Checkpoint**: Security hardening, observability, health checks, and final validation support are complete.

---

## Fase 13: Empacotamento Para Deploy

**Goal**: Package backend and frontend for manual VPS deployment with Docker, nginx, Let's Encrypt guidance, and external backups. No CI/CD in MVP.

- [ ] T165 [P] Create backend production Dockerfile for ASP.NET Core API in `backend/Dockerfile` (deps: T161)
- [ ] T166 [P] Create frontend production Dockerfile and nginx static config in `frontend/Dockerfile` and `frontend/nginx.conf` (deps: T155)
- [ ] T167 Create production docker-compose stack for API, frontend, PostgreSQL, and nginx reverse proxy in `deploy/docker-compose.yml` (deps: T165, T166)
- [ ] T168 [P] Create nginx reverse proxy template with HTTPS upstream routing in `deploy/nginx/agendella.conf` (deps: T166)
- [ ] T169 [P] Create Let's Encrypt manual setup instructions in `deploy/nginx/letsencrypt.md` (deps: T168)
- [ ] T170 [P] Create PostgreSQL daily backup script and restore instructions in `deploy/backups/postgres-backup.sh` and `deploy/backups/restore.md` (deps: T167)
- [ ] T171 Create manual VPS deployment runbook with `docker-compose pull && docker-compose up -d` in `docs/deployment.md` (deps: T167, T168, T169, T170)
- [ ] T172 [P] Add production environment variable template without secrets in `deploy/.env.example` (deps: T167)
- [ ] T173 Validate quickstart and deployment documentation references in `specs/001-salon-scheduling-core/quickstart.md`, `docs/local-development.md`, and `docs/deployment.md` (deps: T163, T171)

**Checkpoint**: MVP can be manually deployed to a simple Linux VPS without CI/CD.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 0** starts immediately.
- **Fase 1** depends on Fase 0.
- **Fase 2** depends on Fase 1.
- **Fase 3** depends on Fase 2 and blocks all tenant-sensitive user story work.
- **Fase 4** depends on Fase 3 and blocks protected API and frontend flows.
- **Fase 5** depends on Fase 4 and delivers the first independently testable admin cadastro increment.
- **Fase 6** depends on Fase 5 and delivers the core scheduling increment.
- **Fase 7** depends on Fase 6 and completes block/absence review behavior.
- **Fase 8** depends on Fase 4 and can proceed while Fase 5 to Fase 7 backend work proceeds.
- **Fase 9** depends on Fase 5 and Fase 8.
- **Fase 10** depends on Fase 6 and Fase 8.
- **Fase 11** depends on Fase 7, Fase 9, and Fase 10.
- **Fase 12** depends on backend feature completion through Fase 7 and frontend shell through Fase 8.
- **Fase 13** depends on Fase 12 and frontend completion through Fase 11.

### User Story Dependencies

- **US1 (P1)**: Depends on Fase 0 to Fase 4 foundation; implemented primarily in Fase 5, Fase 6, Fase 7, Fase 8, Fase 9, Fase 10, and Fase 11.
- **US2 (P2)**: Depends on Fase 0 to Fase 4 foundation plus shared cadastro/scheduling services; implemented primarily in Fase 5, Fase 6, Fase 7, Fase 8, Fase 9, Fase 10, and Fase 11.
- **US3 (P3)**: Depends on Fase 5 cadastro and Fase 6 scheduling; implemented primarily in Fase 6, Fase 10, and Fase 11.

### Critical Rule Test Pairing

- Tenant isolation implementation tasks T033 to T036 are paired with tests T038 to T040.
- Authorization implementation tasks T054, T068 to T077, and T110 to T113 are paired with tests T058, T065, T079, and T104.
- Unique client phone implementation T073 is paired with tests T032 and T064.
- Validation pipeline and validators implementation tasks T018, T053, T067, T088, T107, and T109 are paired with tests T019, T052, T066, T087, T106, and T108.
- Scheduling conflict and availability implementation T089 to T094 are paired with tests T081 to T086 and T101.
- Concurrency and exclusion constraint implementation T091 to T092 are paired with test T085.
- Block and absence review implementation T110 to T113 are paired with tests T102, T103, T114, and T115.
- Refresh token, cookie, and CSRF implementation T048 to T051 are paired with tests T056 and T057.
- CORS implementation T044 is paired with test T043.
- Pilot admin seed implementation T046 depends on seeded tenant T033 and password hashing T045.
- Rate limiting implementation T159 is paired with test T156.

---

## Parallel Execution Examples

### Fase 0

```text
Task: T004 Create initial ASP.NET Core API entry point
Task: T005 Create Angular standalone application
Task: T007 Configure backend xUnit test infrastructure
Task: T008 Add repository-level ignore and editor defaults
```

### Fase 5 / US1

```text
Task: T060 Add salon and business-hours contract tests
Task: T061 Add services contract tests
Task: T062 Add professionals contract tests
Task: T063 Add clients contract tests
Task: T064 Add duplicate client phone service test
Task: T065 Add admin authorization tests
Task: T066 Add cadastro validation tests
```

### Fase 6 / Scheduling

```text
Task: T081 Add appointment overlap/consecutive tests
Task: T082 Add manual end tests
Task: T083 Add availability precedence tests
Task: T084 Add timezone scheduling tests
Task: T085 Add concurrency tests
Task: T086 Add appointment API contract tests
Task: T087 Add scheduling validation tests
```

### Fase 8 To Fase 11 / Frontend

```text
Task: T116 Add auth service tests
Task: T117 Add HTTP interceptor tests
Task: T118 Add guard and shell tests
Task: T126 Add salon settings form tests
Task: T136 Add agenda API service tests
Task: T147 Add client history UI tests
```

---

## Implementation Strategy

### MVP First

1. Complete Fase 0 to Fase 4 to establish repository, persistence, tenant isolation, and auth.
2. Complete Fase 5 for US1 cadastros and validate administradora can configure the tenant.
3. Complete Fase 6 for US1 scheduling core and validate conflict, availability, concurrency, and history behavior.
4. Complete Fase 7 for US1/US2 blocks and absences with `RequiresReview`.
5. Complete Fase 8 to Fase 11 for mobile-first frontend flows.
6. Complete Fase 12 and Fase 13 for hardening and manual MVP deploy.

### Suggested MVP Scope

The MVP scope is the full Fase 0 to Fase 13 sequence because the user explicitly included all phases in the MVP and excluded CI/CD only.

### Incremental Validation

- After Fase 5, validate salon setup, services, professionals, availability, and clients.
- After Fase 6, validate end-to-end scheduling without blocks/absences.
- After Fase 7, validate block/absence review behavior.
- After Fase 11, validate complete mobile browser workflows.
- After Fase 13, validate manual VPS deployment documentation and package artifacts.

## Format Validation

- All executable tasks use the required checkbox format with sequential IDs.
- All user-story implementation tasks include `[US1]`, `[US2]`, or `[US3]` labels.
- All tasks include exact file paths and dependency IDs.
- `[P]` appears only on tasks intended to touch independent files with no dependency on incomplete same-phase tasks.
