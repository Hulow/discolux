# Refactor codebase into release, market, and shared domains

## Why

Release metadata (Discogs release, community rating, batch fetch) and marketplace data (listings, sale statistics) are different concerns. The codebase currently mixes them under `src/api/release`, `src/application/release`, and a single `DiscogsClient` port. Splitting into bounded contexts makes dependencies explicit and keeps each domain’s Discogs integration limited to the endpoints it needs.

## What

Reorganize `src/` into three top-level domains — `release/`, `market/`, and `shared/` — each with `web/`, and (where applicable) `application/` and `infrastructure/` layers. HTTP routes, request/response shapes, and auth behavior stay unchanged. After all tasks, remove the old flat `api/release`, `application/release`, and `infrastructure/discogs` trees.

**Target layout:**

```
src/
  shared/
    web/
      health/          # HealthController, HealthModule, DTO
      swagger/         # setup-swagger.ts
      guards/          # ApiKeyGuard (used by release + market)
    infrastructure/
      discogs/
        discogs-http.client.ts      # single HTTP implementation (all Discogs paths)
        discogs-http.client.spec.ts
        shared-discogs.module.ts    # exports DiscogsHttpClient for adapters

  release/
    web/
      get-release.controller.ts
      get-release-community-rating.controller.ts
      get-releases-in-batch.controller.ts
      release-web.module.ts
    application/
      ports/release-discogs-client.port.ts   # getRelease, getReleaseCommunityRating only
      get-release.command.ts
      get-release.command-handler.ts (+ .spec.ts)
      get-release-community-rating.query.ts
      get-release-community-rating.query-handler.ts (+ .spec.ts)
      get-releases-in-batch.query.ts
      get-releases-in-batch.query-handler.ts (+ .spec.ts)
      release-application.module.ts
    infrastructure/
      discogs/
        release-discogs.client.ts     # adapter delegating to DiscogsHttpClient
        release-discogs.module.ts     # provides RELEASE_DISCOGS_CLIENT

  market/
    web/
      get-release-listing.controller.ts
      get-release-statistic.controller.ts
      market-web.module.ts
    application/
      ports/market-discogs-client.port.ts  # getMarketplaceListing, getReleaseMarketplaceStats only
      get-release-listing.query.ts
      get-release-listing.query-handler.ts (+ .spec.ts)
      get-release-statistic.query.ts
      get-release-statistic.query-handler.ts (+ .spec.ts)
      market-application.module.ts
    infrastructure/
      discogs/
        market-discogs.client.ts
        market-discogs.module.ts      # provides MARKET_DISCOGS_CLIENT

  app.module.ts
  configure-app.ts
  main.ts
```

## Context

**Relevant files (current locations):**

| Current path | Role |
|---|---|
| `src/api/release/get-release.module.ts` | Monolithic Nest module — all 5 controllers |
| `src/api/release/guards/api-key.guard.ts` | Shared by release + market controllers |
| `src/api/health/*` | Health endpoint |
| `src/api/swagger/setup-swagger.ts` | OpenAPI setup |
| `src/application/release/release-application.module.ts` | All CQRS handlers |
| `src/application/release/ports/discogs-client.port.ts` | Monolithic port (`DISCOGS_CLIENT`) |
| `src/infrastructure/discogs/discogs-http.client.ts` | Full Discogs HTTP client |
| `src/app.module.ts` | Imports `HealthModule`, `GetReleaseModule` |
| `test/release.e2e-spec.ts` | E2E for all release + market routes |

**HTTP routes (must not change):**

| Method | Path | Controller |
|---|---|---|
| GET | `/health` | HealthController |
| GET | `/release/:id` | GetReleaseController |
| GET | `/community/rating/release/:releaseId` | GetReleaseCommunityRatingController |
| GET | `/release/batch?from=&till=` | GetReleasesInBatchController |
| GET | `/release/listing/:listingId` | GetReleaseListingController |
| GET | `/release/statistic?releaseId=` | GetReleaseStatisticController |

**Patterns to follow:**

- Nest modules per layer: web module imports application module; application module imports domain infrastructure module
- CQRS handlers inject a port via `@Inject(TOKEN)` (see `get-release.command-handler.ts`)
- Handler unit tests use a **class stub** implementing the port — no `jest.fn()` (see `get-releases-in-batch.query-handler.spec.ts`)
- E2E overrides the domain’s DI token with `.overrideProvider(...).useValue({ ... })` (see `test/release.e2e-spec.ts`)

**Key decisions already made:**

- Use folder name **`web`** (not `api`) for controllers within each domain
- **One** `DiscogsHttpClient` in `shared/infrastructure/discogs` — no duplicated fetch/token logic
- **Interface segregation:** each domain gets its own port with only the methods that domain needs; infrastructure adapters delegate to `DiscogsHttpClient`
- DI tokens: `RELEASE_DISCOGS_CLIENT`, `MARKET_DISCOGS_CLIENT` (replace monolithic `DISCOGS_CLIENT`)
- `ApiKeyGuard` lives in **`shared/web/guards`** because both domains use it
- **No API breaking changes** — same paths, query params, headers (`x-api-key`), and response bodies
- Keep relative imports between layers (existing code does not use `@api/*` path aliases in practice)

## Constraints

**Must:**

- Preserve all existing unit and e2e test behavior (update import paths only unless splitting e2e)
- Keep `DiscogsHttpClient` as the single place that calls `fetch` and reads `DISCOGS_TOKEN`
- Each domain infrastructure module only registers methods its port exposes
- Run `npm run build && npm run test && npm run test:e2e` before marking a task done

**Must not:**

- Change HTTP routes, controller decorators, or public response contracts
- Add new npm dependencies
- Duplicate HTTP client implementation across domains
- Use `jest.fn()` in handler unit tests

**Out of scope:**

- Removing `console.log` in `discogs-http.client.ts`
- Typed Discogs DTOs (responses stay `unknown`)
- New features or error-handling changes beyond what already exists
- `src/domain/` layer (not used today)

## Tasks

### T1: Extract shared web and Discogs HTTP infrastructure

**Do:**

1. Create `src/shared/web/health/` — move `health.controller.ts`, `health.module.ts`, `health-response.dto.ts` from `src/api/health/`
2. Create `src/shared/web/swagger/` — move `setup-swagger.ts` from `src/api/swagger/`
3. Create `src/shared/web/guards/api-key.guard.ts` — move from `src/api/release/guards/`
4. Create `src/shared/infrastructure/discogs/` — move `discogs-http.client.ts` and `discogs-http.client.spec.ts`; rename module to `shared-discogs.module.ts` exporting **`DiscogsHttpClient`** (the class) for adapters
5. Move `discogs-client.port.ts` to `src/shared/application/ports/discogs-client.port.ts` temporarily (full interface + `DISCOGS_CLIENT` token) so existing handlers still compile
6. Update `DiscogsModule` provider to import from shared paths; wire `DISCOGS_CLIENT` → `DiscogsHttpClient` as today
7. Update `app.module.ts`, `configure-app.ts`, `src/api/release/*` imports (guard, module), and `test/health.e2e-spec.ts`, `test/swagger.e2e-spec.ts`
8. Delete empty `src/api/health/`, `src/api/swagger/`

**Files:** all files listed above, plus `src/app.module.ts`, `src/configure-app.ts`, `src/infrastructure/discogs/discogs.module.ts` (delete after move), `src/api/release/get-release.module.ts` and controllers (import path for guard only)

**Verify:** `npm run build && npm run test && npm run test:e2e`

---

### T2: Extract release bounded context

**Do:**

1. Create `src/release/application/ports/release-discogs-client.port.ts`:

   ```typescript
   export const RELEASE_DISCOGS_CLIENT = Symbol('RELEASE_DISCOGS_CLIENT');
   export interface ReleaseDiscogsClient {
     getRelease(releaseId: string): Promise<unknown>;
     getReleaseCommunityRating(releaseId: string): Promise<unknown>;
   }
   ```

2. Create `src/release/infrastructure/discogs/release-discogs.client.ts` — `@Injectable()` adapter injecting `DiscogsHttpClient`, implementing `ReleaseDiscogsClient` by delegating to `getRelease` / `getReleaseCommunityRating`
3. Create `release-discogs.module.ts` — `providers: [{ provide: RELEASE_DISCOGS_CLIENT, useClass: ReleaseDiscogsClient }]`, `imports: [SharedDiscogsModule]`, `exports: [RELEASE_DISCOGS_CLIENT]`
4. Move release application files (handlers, queries, command, specs) to `src/release/application/`; update handlers to inject `RELEASE_DISCOGS_CLIENT` and import `ReleaseDiscogsClient`
5. Move release controllers to `src/release/web/`; update guard import to `shared/web/guards/api-key.guard`
6. Create `release-application.module.ts` and `release-web.module.ts` (web imports application + registers the three controllers + `ApiKeyGuard`)
7. Update `get-release.module.ts`: remove release controllers/handlers; keep only market controllers until T3 (or remove module in T3)
8. Update `app.module.ts` to import `ReleaseWebModule`
9. Update handler specs: stub class implements `ReleaseDiscogsClient` only
10. Update `test/release.e2e-spec.ts`: `.overrideProvider(RELEASE_DISCOGS_CLIENT)` with stub implementing `getRelease` and `getReleaseCommunityRating` only for release-related tests; keep `DISCOGS_CLIENT` override for market tests until T3

**Files:** release handlers/controllers/specs, `src/app.module.ts`, `src/api/release/get-release.module.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run build && npm run test && npm run test:e2e` — all release routes (`/release/:id`, `/community/rating/release/:id`, `/release/batch`) still pass

---

### T3: Extract market bounded context

**Do:**

1. Create `src/market/application/ports/market-discogs-client.port.ts`:

   ```typescript
   export const MARKET_DISCOGS_CLIENT = Symbol('MARKET_DISCOGS_CLIENT');
   export interface MarketDiscogsClient {
     getMarketplaceListing(listingId: string): Promise<unknown>;
     getReleaseMarketplaceStats(releaseId: string): Promise<unknown>;
   }
   ```

2. Create `market-discogs.client.ts` adapter + `market-discogs.module.ts` (mirror release pattern)
3. Move listing/statistic handlers, queries, specs to `src/market/application/`
4. Move `get-release-listing.controller.ts` and `get-release-statistic.controller.ts` to `src/market/web/`
5. Create `market-application.module.ts` and `market-web.module.ts`
6. Update `app.module.ts`: import `MarketWebModule`, remove `GetReleaseModule`
7. Delete `src/api/release/` directory entirely
8. Split e2e: move listing/statistic tests to `test/market.e2e-spec.ts` with `MARKET_DISCOGS_CLIENT` override; keep release-only tests in `test/release.e2e-spec.ts` with `RELEASE_DISCOGS_CLIENT` only
9. Remove `src/shared/application/ports/discogs-client.port.ts` and `DISCOGS_CLIENT` if no longer referenced

**Files:** market layer files, `src/app.module.ts`, `test/release.e2e-spec.ts`, new `test/market.e2e-spec.ts`

**Verify:** `npm run build && npm run test && npm run test:e2e`

---

### T4: Remove legacy application/release tree and finalize AppModule

**Do:**

1. Delete `src/application/release/` if any files remain
2. Delete `src/infrastructure/discogs/` if any files remain
3. Confirm `app.module.ts` imports only: `ConfigModule`, `CqrsModule`, `HealthModule` (from shared), `ReleaseWebModule`, `MarketWebModule`
4. Grep for stale imports: `application/release`, `api/release`, `DISCOGS_CLIENT` (monolithic), `GetReleaseModule`, `ReleaseApplicationModule`
5. Optional: add `SharedWebModule` exporting `ApiKeyGuard` if duplicate provider registration is a concern (not required if each web module provides it)

**Files:** `src/app.module.ts`, any stragglers found by grep

**Verify:** `npm run build && npm run test && npm run test:e2e` and `rg 'application/release|api/release|GetReleaseModule|DISCOGS_CLIENT'` returns no matches under `src/` or `test/` (except comments if any)

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] Folder layout matches **Target layout** above; no `src/api/release` or `src/application/release`
- [ ] Release handlers depend only on `ReleaseDiscogsClient`; market handlers only on `MarketDiscogsClient`
- [ ] All six protected routes respond as before with valid `x-api-key`
- [ ] Batch partial-failure e2e (`releaseId` `2` fails) still returns `200` with mixed success/error array

## Implementation notes

**Fresh session prompt:** `Read specs/010-refactor-code-base.md and implement T1` (then T2, T3, T4 in separate sessions/commits).

**Suggested commits:** `T1: extract shared web and discogs infrastructure`, `T2: extract release bounded context`, `T3: extract market bounded context`, `T4: remove legacy release module paths`
