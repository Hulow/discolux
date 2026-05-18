# Implement release statistics endpoint

## Why

Access to the Discogs API is required to fetch marketplace statistics (items for sale, lowest price, sale eligibility) for a release by release id.

## What

A read endpoint `GET /release/statistic?releaseId={releaseId}` that returns the Discogs marketplace statistics JSON, backed by `GET /marketplace/stats/{release_id}` on the Discogs HTTP client and a query handler that delegates to the existing `DiscogsClient` port.

## Context

**Relevant files:**
- `src/application/release/ports/discogs-client.port.ts` — port (`DiscogsClient`) and DI token (`DISCOGS_CLIENT`)
- `src/infrastructure/discogs/discogs-http.client.ts` — HTTP adapter (fetch + token on URL)
- `src/application/release/get-release-listing.query-handler.ts` — reference query handler wiring Discogs port
- `src/api/release/get-release-listing.controller.ts` — reference thin controller + `ApiKeyGuard` + Swagger
- `test/release.e2e-spec.ts` — e2e overrides `DISCOGS_CLIENT`

**Patterns to follow:**
- Port in application, adapter in infrastructure (`003-implement-discogs-client.md`)
- Query + `QueryHandler` + `QueryBus` on read side (per hexagonal skill)
- Handler unit tests use a stub implementing the port (no `jest.fn()` in handler spec)
- E2E overrides `DISCOGS_CLIENT` to avoid real HTTP
- One controller per HTTP operation (`api-layer.mdc`)

**Key decisions already made:**
- Reuse `DISCOGS_CLIENT` / `DiscogsHttpClient` and `DiscogsModule`
- `GetReleaseStatisticResult` is `unknown` (passthrough of Discogs JSON)
- Same `ApiKeyGuard` and Swagger patterns as `GetReleaseListingController`
- Route: `GET /release/statistic?releaseId=` (query param, not path — avoids collision with `GET /release/:id` and `GET /release/listing/:listingId`)
- Discogs upstream: `GET /marketplace/stats/{release_id}` (optional `curr_abbr` not exposed on this API yet)

## Constraints

**Must:**
- Follow hexagonal layering: application port, infrastructure adapter, query handler
- Append token on every Discogs request (existing `buildUrl`)
- Require `releaseId` query parameter on the public endpoint

**Must not:**
- Hit Discogs in unit or e2e tests without overriding the port

**Out of scope:**
- Domain mapping of Discogs stats shape
- `curr_abbr` query passthrough to Discogs
- Error-to-HTTP mapping (non-OK Discogs responses throw generic `Error` today)

## Tasks

### T1: Implement `GET /release/statistic` controller

**Do:** Add `GetReleaseStatisticController` under `src/api/release/` with `@Query('releaseId')`, `QueryBus`, `ApiKeyGuard`, and Swagger decorators (`@ApiQuery` for `releaseId`). Register in `GetReleaseModule`.

**Files:** `src/api/release/get-release-statistic.controller.ts`, `src/api/release/get-release.module.ts`

**Verify:** `npm run build`

### T2: Add `getReleaseMarketplaceStats` to Discogs client

**Do:** Extend `DiscogsClient` port and `DiscogsHttpClient` with `getReleaseMarketplaceStats(releaseId)` calling `GET /marketplace/stats/{releaseId}`. Add unit test for URL and token.

**Files:** `src/application/release/ports/discogs-client.port.ts`, `src/infrastructure/discogs/discogs-http.client.ts`, `src/infrastructure/discogs/discogs-http.client.spec.ts`

**Verify:** `npm run test -- discogs-http.client.spec.ts`

### T3: Implement `GetReleaseStatisticQueryHandler`

**Do:** Add `GetReleaseStatisticQuery` + handler injecting `DISCOGS_CLIENT`, call `getReleaseMarketplaceStats`. Register handler in `ReleaseApplicationModule`. Handler unit test (stub) and e2e cases (extend `DISCOGS_CLIENT` override stub with sample stats payload).

**Files:** `src/application/release/get-release-statistic.query.ts`, `src/application/release/get-release-statistic.query-handler.ts`, `src/application/release/get-release-statistic.query-handler.spec.ts`, `src/application/release/release-application.module.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run test && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release/statistic?releaseId=12345` with valid `x-api-key` returns Discogs stats JSON (e2e uses stubbed client; example shape: `lowest_price`, `num_for_sale`, `blocked_from_sale`)
- [ ] No regressions on `GET /release/:id`, community rating, or marketplace listing endpoints
