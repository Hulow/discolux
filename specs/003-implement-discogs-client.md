# Implement Discogs client

## Why

Access to the Discogs API is required to fetch release data by release id.

## What

A hexagonal Discogs HTTP adapter that appends the API token to every request, exposes `getRelease` for `GET /releases/{release_id}`, and wires it into `GetReleaseCommandHandler` so `GET /release/:id` returns the Discogs JSON payload.

## Instructions

Create `specs/<feature-slug>.md`:

Follow the skill Implement use case hexagonal

## Context

**Relevant files:**
- `src/application/release/ports/discogs-client.port.ts` — port (`DiscogsClient`) and DI token (`DISCOGS_CLIENT`)
- `src/infrastructure/discogs/discogs-http.client.ts` — HTTP adapter (fetch + token on URL)
- `src/infrastructure/discogs/discogs.module.ts` — binds `DISCOGS_CLIENT` → `DiscogsHttpClient`
- `src/application/release/get-release.command-handler.ts` — delegates to `DiscogsClient.getRelease`
- `src/application/release/release-application.module.ts` — imports `DiscogsModule`
- `.env.example` — documents `DISCOGS_TOKEN`

**Patterns to follow:**
- Port in application, adapter in infrastructure (`002-implement-release-controller.md`, hexagonal skill)
- Handler unit tests use a stub implementing the port (no `jest.fn()` in handler spec)
- E2E overrides `DISCOGS_CLIENT` to avoid real HTTP

**Key decisions already made:**
- Base URL: `https://api.discogs.com`
- Token via `ConfigService.getOrThrow('DISCOGS_TOKEN')`, appended as `?token=` or `&token=` depending on existing query string
- `User-Agent: Discolux/0.0.1` and Discogs v2 `Accept` header on every request
- `GetReleaseResult` is `unknown` (passthrough of Discogs JSON)
- No new npm dependencies (native `fetch`)

## Constraints

**Must:**
- Follow hexagonal layering: application port, infrastructure adapter
- Append token on every Discogs request

**Must not:**
- Hit Discogs in unit or e2e tests without overriding the port

**Out of scope:**
- Domain mapping of Discogs release shape
- Error-to-HTTP mapping (non-OK Discogs responses throw generic `Error` today)

## Tasks

### T1: Create a Discogs client that always appends the API token

**Do:** Add `DiscogsClient` port + `DiscogsHttpClient` with private `buildUrl()` that appends `token` from `DISCOGS_TOKEN`. Register in `DiscogsModule`.

**Files:** `src/application/release/ports/discogs-client.port.ts`, `src/infrastructure/discogs/discogs-http.client.ts`, `src/infrastructure/discogs/discogs.module.ts`, `src/infrastructure/discogs/discogs-http.client.spec.ts`, `.env.example`

**Verify:** `npm run test -- discogs-http.client.spec.ts`

### T2: Create `getRelease` for `/releases/{release_id}`

**Do:** Implement `getRelease(releaseId)` calling `GET /releases/{releaseId}` and returning parsed JSON.

**Files:** `src/infrastructure/discogs/discogs-http.client.ts`

**Verify:** `npm run test -- discogs-http.client.spec.ts`

### T3: Inject Discogs client in `GetReleaseCommandHandler`

**Do:** Inject `DISCOGS_CLIENT`, call `getRelease(command.releaseId)`, return Discogs response. Import `DiscogsModule` in `ReleaseApplicationModule`. Update handler unit test (stub) and e2e (override provider).

**Files:** `src/application/release/get-release.command-handler.ts`, `src/application/release/release-application.module.ts`, `src/application/release/get-release.command-handler.spec.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run test && npm run test:e2e`

## Done

- [x] `npm run build && npm run test && npm run test:e2e` passes
- [x] `GET /release/:id` with valid `x-api-key` returns Discogs release JSON (e2e uses stubbed client)
- [x] `DISCOGS_TOKEN` documented in `.env.example`; set in `.env` for live Discogs calls
