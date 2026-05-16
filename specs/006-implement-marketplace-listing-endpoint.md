# Implement marketplace listing endpoint

## Why

Access to the Discogs API is required to fetch marketplace listing details by listing id.

## What

A read endpoint `GET /release/listing/:listingId` that returns the Discogs marketplace listing JSON, backed by `GET /marketplace/listings/{listing_id}` on the Discogs HTTP client and a query handler that delegates to the existing `DiscogsClient` port.

## Context

**Relevant files:**
- `src/application/release/ports/discogs-client.port.ts` — port (`DiscogsClient`) and DI token (`DISCOGS_CLIENT`)
- `src/infrastructure/discogs/discogs-http.client.ts` — HTTP adapter (fetch + token on URL)
- `src/application/release/get-release-community-rating.query-handler.ts` — reference query handler wiring Discogs port
- `src/api/release/get-release-community-rating.controller.ts` — reference thin controller + `ApiKeyGuard` + Swagger
- `test/release.e2e-spec.ts` — e2e overrides `DISCOGS_CLIENT`

**Patterns to follow:**
- Port in application, adapter in infrastructure (`003-implement-discogs-client.md`)
- Query + `QueryHandler` + `QueryBus` on read side (per hexagonal skill)
- Handler unit tests use a stub implementing the port (no `jest.fn()` in handler spec)
- E2E overrides `DISCOGS_CLIENT` to avoid real HTTP
- One controller per HTTP operation (`api-layer.mdc`)

**Key decisions already made:**
- Reuse `DISCOGS_CLIENT` / `DiscogsHttpClient` and `DiscogsModule`
- `GetReleaseListingResult` is `unknown` (passthrough of Discogs JSON)
- Same `ApiKeyGuard` and Swagger patterns as `GetReleaseController`
- Route: `GET /release/listing/:listingId` (avoids collision with `GET /release/:id`)

## Constraints

**Must:**
- Follow hexagonal layering: application port, infrastructure adapter, query handler
- Append token on every Discogs request (existing `buildUrl`)

**Must not:**
- Hit Discogs in unit or e2e tests without overriding the port

**Out of scope:**
- Domain mapping of Discogs listing shape
- Error-to-HTTP mapping (non-OK Discogs responses throw generic `Error` today)

## Tasks

### T1: Implement `GET /release/listing/:listingId` controller

**Do:** Add `GetReleaseListingController` under `src/api/release/` using `QueryBus`, `ApiKeyGuard`, and Swagger decorators. Register in `GetReleaseModule`.

**Files:** `src/api/release/get-release-listing.controller.ts`, `src/api/release/get-release.module.ts`

**Verify:** `npm run build`

### T2: Add `getMarketplaceListing` to Discogs client

**Do:** Extend `DiscogsClient` port and `DiscogsHttpClient` with `getMarketplaceListing(listingId)` calling `GET /marketplace/listings/{listingId}`. Add unit test for URL and token.

**Files:** `src/application/release/ports/discogs-client.port.ts`, `src/infrastructure/discogs/discogs-http.client.ts`, `src/infrastructure/discogs/discogs-http.client.spec.ts`

**Verify:** `npm run test -- discogs-http.client.spec.ts`

### T3: Implement `GetReleaseListingQueryHandler`

**Do:** Add query + handler injecting `DISCOGS_CLIENT`, call `getMarketplaceListing`. Register handler in `ReleaseApplicationModule`. Handler unit test (stub) and e2e cases (override provider).

**Files:** `src/application/release/get-release-listing.query.ts`, `src/application/release/get-release-listing.query-handler.ts`, `src/application/release/get-release-listing.query-handler.spec.ts`, `src/application/release/release-application.module.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run test && npm run test:e2e`

## Done

- [x] `npm run build && npm run test && npm run test:e2e` passes
- [x] `GET /release/listing/:listingId` with valid `x-api-key` returns Discogs listing JSON (e2e uses stubbed client)
- [x] No regressions on `GET /release/:id` or community rating endpoint
