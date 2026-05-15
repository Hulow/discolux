# Implement Swagger API

## Why

A more convenient way to explore and test the Discolux API without reading controller code.

## What

Swagger UI at `/api` documenting every HTTP endpoint, including auth requirements for protected routes.

## Context

**Relevant files:**
- `src/main.ts` — bootstrap; call Swagger setup after app creation
- `src/api/swagger/setup-swagger.ts` — DocumentBuilder + SwaggerModule setup
- `src/api/health/health.controller.ts` — `GET /health`
- `src/api/release/get-release.controller.ts` — `GET /release/:id` (API key guard)

**Patterns to follow:**
- API-layer DTOs colocated with controllers (`.cursor/rules/api-layer.mdc`)
- Hexagonal skill: Swagger stays in the API/transport layer only

## Constraints

**Must:**
- Use `@nestjs/swagger`
- Document all existing endpoints

**Must not:**
- Change handler or domain logic for OpenAPI

**Out of scope:**
- Generating clients from OpenAPI
- Documenting Discogs upstream API shapes in full

## Tasks

### T1: Implement Swagger API

**Do:** Install `@nestjs/swagger`, add `setupSwagger`, mount UI at `/api` in `main.ts`.

**Files:** `package.json`, `src/main.ts`, `src/api/swagger/setup-swagger.ts`

**Verify:** `npm run build` and manual: open `http://localhost:3000/api`

### T2: Add Swagger to all current endpoints

**Do:** Add `@ApiTags`, operation/response decorators, and `x-api-key` security on release routes.

**Files:** `src/api/health/*`, `src/api/release/get-release.controller.ts`

**Verify:** `npm run build && npm run test && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `/api` lists `GET /health` and `GET /release/{id}` with API key auth on release
