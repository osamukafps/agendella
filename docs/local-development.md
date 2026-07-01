# Local Development

## Prerequisites

- Ubuntu Linux
- .NET SDK 10.x
- Node.js 24.x and npm 11.x
- Angular CLI 21.x available through `npx ng`

## Repository Layout

- `backend/`: .NET solution and projects
- `frontend/`: Angular SPA
- `deploy/`: production packaging assets
- `docs/`: local and deployment documentation

## Backend Bootstrap Commands

```bash
dotnet restore backend/Agendella.sln
dotnet test backend/Agendella.sln
dotnet run --project backend/Agendella.Api
```

## Phase 12 Validation Commands

```bash
dotnet build backend/Agendella.sln
dotnet test backend/Agendella.Tests/Agendella.Tests.csproj
curl -i http://localhost:5070/healthz
curl -i http://localhost:5070/healthz/ready
curl -i -X POST http://localhost:5070/auth/refresh -H "X-CSRF-Protection: 1"
```

## EF Core Migrations

```bash
dotnet ef migrations add InitialCreate --project backend/Agendella.Infrastructure --startup-project backend/Agendella.Api
dotnet ef database update --project backend/Agendella.Infrastructure --startup-project backend/Agendella.Api
dotnet ef migrations list --project backend/Agendella.Infrastructure --startup-project backend/Agendella.Api
```

## Local Database Defaults

- Development database: `agendella_dev`
- Connection string source: `backend/Agendella.Api/appsettings.Development.json`
- Integration test override env var: `AGENDLLA_TEST_POSTGRES`
- Senha seed da administradora piloto: `AGENDLLA_PILOT_ADMIN_PASSWORD`

## Tenant Isolation Notes

- O `AgendellaDbContext` aplica filtros globais por `TenantId` a todas as entidades multi-tenant.
- O backend grava `app.tenant_id` na sessao PostgreSQL via `TenantSessionInterceptor`.
- As migrations da Fase 3 habilitam RLS nas tabelas com `TenantId`.
- A role `agendella_admin` e criada com `BYPASSRLS` para futuros fluxos administrativos revisados, fora do caminho normal da API autenticada.

## Frontend Bootstrap Commands

```bash
npm install --prefix frontend
npm run build --prefix frontend
npm run test --prefix frontend
npm start --prefix frontend
```

## Notes

- TailwindCSS is pre-scaffolded in the frontend through `src/styles.css`, `tailwind.config.js`, and `postcss.config.js`.
- Vitest is the default frontend test runner in this repository.
- Docker is reserved for later deploy packaging, but `.dockerignore` is already present at repository root.
