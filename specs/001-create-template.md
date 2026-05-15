# Create discolux web server

## Why

We need a web server to communicate with the Discogs API.

## What

A NestJS web server with Docker packaging, ready for hexagonal feature slices.

## Context

**Relevant files:**
- `src/api/` — HTTP controllers and DTOs
- `src/application/` — commands, queries, handlers
- `src/domain/` — aggregates, value objects, ports
- `src/infrastructure/` — adapters (ORM, external APIs)
- `.cursor/rules/` — layer constraints

**Patterns to follow:**
- Hexagonal + CQRS per `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc`
- One controller per HTTP operation (`.cursor/rules/api-layer.mdc`)

## Constraints

**Must:**
- Follow implement-use-case-hexagonal skill and `.cursor/rules/`

**Must not:**
- Put business logic in controllers or DTOs
- Import infrastructure/framework into domain

**Out of scope:**
- Discogs API integration (follow-up spec)

## Tasks

### T1: Setup a NestJS web server

**Do:** Bootstrap NestJS with `api/`, `application/`, `domain/`, `infrastructure/` folders; add `GET /health`.

**Files:** `package.json`, `src/**`, `test/health.e2e-spec.ts`

**Verify:** `npm run build && npm run test:e2e`

### T2: Create docker image

**Do:** Multi-stage `Dockerfile` for production build.

**Files:** `Dockerfile`, `.dockerignore`

**Verify:** `docker build -t discolux .`

### T3: Create docker compose

**Do:** `docker-compose.yml` exposing the API on port 3000.

**Files:** `docker-compose.yml`

**Verify:** `docker compose up --build` then `curl http://localhost:3000/health`

## Done

- [ ] `npm run build && npm run test:e2e` passes
- [ ] `docker compose up --build` and health check returns `{"status":"ok"}`
