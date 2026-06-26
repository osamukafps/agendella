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
dotnet restore backend/Agendella.slnx
dotnet test backend/Agendella.slnx
dotnet run --project backend/Agendella.Api
```

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
