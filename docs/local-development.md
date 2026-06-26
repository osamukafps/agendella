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
