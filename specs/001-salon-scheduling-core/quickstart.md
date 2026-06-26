# Quickstart: Salon Scheduling Core MVP

This guide describes how to validate the planned implementation end to end. It does not contain implementation code.

## Prerequisites

- Ubuntu development machine.
- .NET 10 SDK installed.
- Node.js current LTS and npm installed.
- PostgreSQL 16 or newer installed natively and running locally.
- A local database user and database for Agendella.

## Local Setup

1. Create a local PostgreSQL database.

```bash
createdb agendella_dev
```

2. Configure backend settings with a local connection string, JWT issuer/audience, RSA key paths, and refresh-token cookie settings.

3. Restore backend packages and apply migrations.

```bash
dotnet restore backend/Agendella.sln
dotnet ef database update --project backend/Agendella.Infrastructure --startup-project backend/Agendella.Api
```

4. Install frontend dependencies.

```bash
npm install --prefix frontend
```

## Run Locally

1. Start the backend API.

```bash
dotnet run --project backend/Agendella.Api
```

2. Start the frontend SPA.

```bash
npm start --prefix frontend
```

3. Open the frontend in a mobile-width browser viewport and authenticate as either administradora or profissional.

## Required Validation Scenarios

### Tenant isolation

- Seed two salons with distinct tenants and records.
- Authenticate as a collaborator from tenant A.
- Attempt to read, list, search, update, or operate IDs from tenant B.
- Expected result: tenant B records are absent from lists and direct lookups behave as not found. No counts, empty states, availability suggestions, logs, or errors reveal tenant B data.

### Role enforcement

- Authenticate as administradora and verify she can manage salon profile, services, professionals, clients, blocks, and all tenant appointments.
- Authenticate as profissional and verify she can view and operate only her own appointments and absences, plus allowed client operations.
- Attempt professional access to another professional's appointment, salon settings, services, salon blocks, and unrelated client history.
- Expected result: server denies forbidden operations regardless of frontend state.

### Scheduling conflict

- Create an appointment for a professional from 14:00 to 15:00 local salon time.
- Create another for the same professional from 15:00 to 16:00.
- Expected result: consecutive appointment succeeds.
- Try 14:30 to 15:30 for the same professional.
- Expected result: request fails with conflict.

### Availability precedence

- Configure salon business hours, professional weekly availability, a salon block, and a professional absence.
- Search availability across all affected windows.
- Expected result: returned slots respect this order: salon hours, professional weekly availability, salon blocks, professional absences, same-professional appointment conflicts.

### Manual end time

- Create an appointment with service duration 60 minutes and a manual end 90 minutes after start.
- Expected result: conflict checks use the 90-minute interval.
- Try manual end equal to or before start.
- Expected result: request is rejected with a clear validation error.

### Review flags

- Create future appointments.
- Add a salon block or professional absence overlapping them.
- Expected result: the block/absence is created, existing appointments remain unchanged, and affected appointments show `requiresReview` with a visible reason.

### Concurrency

- Submit two concurrent create/reschedule requests for the same professional and overlapping interval.
- Expected result: one succeeds and the losing operation fails clearly without automatic adjustment.

### Timezone handling

- Use a salon with `America/Sao_Paulo` and verify stored database timestamps are UTC `timestamptz` while API/frontend display local salon time.
- Add a test salon in an IANA timezone with DST for automated tests.
- Expected result: local business-hour evaluation remains correct across DST boundaries.

## Test Commands

```bash
dotnet test backend/Agendella.sln
npm test --prefix frontend
```

## Deployment Validation

- Build backend and frontend Docker images.
- Deploy to VPS with `docker-compose pull && docker-compose up -d`.
- Verify nginx HTTPS routing, API health, frontend static serving, database connectivity, migrations, and external backup job.

See `contracts/openapi.yaml` for the API surface and `data-model.md` for entity/rule details.
