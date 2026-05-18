# Implement batch releases endpoint

## Why

Fetching releases one at a time is slow when a client needs many consecutive Discogs release IDs. A single API call should return up to 60 releases for an inclusive ID range (e.g. from `1` till `60`).

## What

A read endpoint `GET /release/batch?from={id}&till={id}` that returns an array of Discogs release JSON objects for every release ID in the inclusive range `[from, till]`, fetched in parallel via the existing `DiscogsClient.getRelease`. The range must contain at least 1 ID and at most 60 IDs.

## Context

**Relevant files:**
- `src/application/release/ports/discogs-client.port.ts` — port (`DiscogsClient`) and DI token (`DISCOGS_CLIENT`); already exposes `getRelease`
- `src/infrastructure/discogs/discogs-http.client.ts` — HTTP adapter (`GET /releases/{releaseId}`)
- `src/application/release/get-release.command-handler.ts` — single-release fetch via `getRelease` (same upstream call as batch)
- `src/api/release/get-release-statistic.controller.ts` — reference query-param controller + `ApiKeyGuard` + Swagger (avoids `GET /release/:id` collision)
- `src/application/release/get-release-statistic.query-handler.ts` — reference query handler wiring Discogs port
- `test/release.e2e-spec.ts` — e2e overrides `DISCOGS_CLIENT`

**Patterns to follow:**
- Port in application, adapter in infrastructure (`003-implement-discogs-client.md`)
- Query + `QueryHandler` + `QueryBus` on read side (per hexagonal skill)
- Handler unit tests use a stub implementing the port (no `jest.fn()` in handler spec)
- E2E overrides `DISCOGS_CLIENT` to avoid real HTTP
- One controller per HTTP operation (`api-layer.mdc`)

**Key decisions already made:**
- Reuse `DISCOGS_CLIENT` / `DiscogsHttpClient` — no new port methods; batch handler calls `getRelease` per ID
- `GetReleasesInBatchResult` is `unknown[]` (ordered array of passthrough Discogs JSON, index `0` = `from`, last = `till`)
- Same `ApiKeyGuard` and Swagger patterns as `GetReleaseStatisticController`
- Route: `GET /release/batch?from=&till=` (query params, static `batch` segment — no collision with `GET /release/:id`)
- Range is **inclusive**: `from=1&till=60` → IDs `1,2,…,60` (60 releases)
- Parallel fetch: `Promise.all` over per-ID `getRelease` calls
- Invalid range → `400 Bad Request` via `BadRequestException` (no `ValidationPipe` in project yet)
- IDs are numeric strings; expand range with integer arithmetic (`Number(from)` … `Number(till)`)

## Constraints

**Must:**
- Follow hexagonal layering: query handler in application, thin controller in API
- Enforce: `from` and `till` present, parseable as integers, `from <= till`, and `(till - from + 1) <= 60` (minimum 1, maximum 60 IDs)
- Return releases in ascending ID order
- Require `x-api-key` on the public endpoint

**Must not:**
- Hit Discogs in unit or e2e tests without overriding the port
- Add new dependencies for validation

**Out of scope:**
- Domain mapping of Discogs release shape
- Partial success (returning releases that succeeded when one fails); `Promise.all` fails the whole request if any `getRelease` rejects
- Pagination or non-contiguous ID lists
- `curr_abbr` or other Discogs query options

## Tasks

### T1: Implement `GET /release/batch` controller

**Do:** Add `GetReleasesInBatchController` under `src/api/release/` with `@Query('from')` and `@Query('till')`, validate inputs (missing, non-integer, `from > till`, count > 60) and throw `BadRequestException` with a clear message. Delegate to `QueryBus` with `GetReleasesInBatchQuery`. Add Swagger (`@ApiQuery` for `from` and `till`, `@ApiOkResponse` as array of objects). Register in `GetReleaseModule`.

**Files:** `src/api/release/get-releases-in-batch.controller.ts`, `src/api/release/get-release.module.ts`

**Verify:** `npm run build`

### T2: Implement `GetReleasesInBatchQueryHandler`

**Do:** Add `GetReleasesInBatchQuery` (holds `from` and `till` as strings) + handler injecting `DISCOGS_CLIENT`. Build ordered ID list from inclusive range, call `discogsClient.getRelease(id)` for each ID via `Promise.all`, return array in ascending order. Register handler in `ReleaseApplicationModule`. Handler unit test: stub returns distinct payloads per ID and asserts order and count. E2e: extend `DISCOGS_CLIENT` override so `getRelease` returns `{ id: Number(releaseId), title: 'Test Release' }`; add cases for happy path (`from=1&till=3` → 3 items), 401 without key, and 400 when `from > till` or range size > 60.

**Files:** `src/application/release/get-releases-in-batch.query.ts`, `src/application/release/get-releases-in-batch.query-handler.ts`, `src/application/release/get-releases-in-batch.query-handler.spec.ts`, `src/application/release/release-application.module.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run test && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release/batch?from=1&till=3` with valid `x-api-key` returns a JSON array of length 3, ordered by ID (e2e uses stubbed client)
- [ ] `GET /release/batch?from=61&till=1` or `from=1&till=61` returns `400`
- [ ] No regressions on `GET /release/:id`, statistic, community rating, or marketplace listing endpoints
