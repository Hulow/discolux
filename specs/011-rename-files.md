# Rename handlers and align Swagger with domains

## Why

Class and file names still carry redundant `Release` prefixes (e.g. `GetReleaseListingController` in the market domain), and `GetRelease` is modeled as a CQRS command despite being a read-only operation. Cleaning names and OpenAPI metadata makes each bounded context easier to navigate; moving path parameters to query parameters standardizes how clients pass IDs.

## What

1. Rename the listed controllers, queries, handlers, and files to shorter names that match their domain.
2. Change `GetRelease` from command/command-handler to query/query-handler (controller uses `QueryBus`).
3. Set Swagger `@ApiTags` to `release` or `market` according to domain (market controllers currently tag `release`).
4. Replace URL path parameters with required query parameters on the three affected GET endpoints; update e2e tests accordingly.

**Done when:** `npm run build && npm run test && npm run test:e2e` pass, OpenAPI shows correct tags and query params, and no stale `GetRelease*` / `*Command*` names remain for the renamed types.

## Context

**Relevant files:**

| Path | Role |
|---|---|
| `src/release/web/get-release-community-rating.controller.ts` | Community rating HTTP adapter |
| `src/release/web/get-release.controller.ts` | Single release HTTP adapter (uses `CommandBus` today) |
| `src/release/web/release-web.module.ts` | Registers release controllers |
| `src/release/application/get-release-community-rating.*` | Community rating CQRS |
| `src/release/application/get-release.command*` | Single release CQRS (to become query) |
| `src/release/application/release-application.module.ts` | Handler providers |
| `src/market/web/get-release-listing.controller.ts` | Listing HTTP adapter (`@ApiTags('release')` — wrong) |
| `src/market/web/get-release-statistic.controller.ts` | Stats HTTP adapter (`@ApiTags('release')` — wrong) |
| `src/market/web/market-web.module.ts` | Registers market controllers |
| `src/market/application/get-release-listing.*` | Listing CQRS |
| `src/market/application/get-release-statistic.*` | Stats CQRS |
| `src/market/application/market-application.module.ts` | Handler providers |
| `test/release.e2e-spec.ts` | Release + community rating routes |
| `test/market.e2e-spec.ts` | Listing + statistic routes |

**Patterns to follow:**

- File names: kebab-case matching class name (`GetListingController` → `get-listing.controller.ts`)
- Rename with `git mv` so history is preserved
- Handler unit tests: class stub implementing the domain port — no `jest.fn()` (see `get-release-community-rating.query-handler.spec.ts`)
- Swagger on query endpoints: `@ApiQuery` + `@Query` (see `get-release-statistic.controller.ts`)
- E2e: override `RELEASE_DISCOGS_CLIENT` / `MARKET_DISCOGS_CLIENT` per `test/release.e2e-spec.ts` and `test/market.e2e-spec.ts`

**Key decisions already made:**

| Old | New |
|---|---|
| `GetReleaseCommunityRatingController` | `GetCommunityRatingController` |
| `GetReleaseCommunityRatingQuery` / `QueryHandler` | `GetCommunityRatingQuery` / `GetCommunityRatingQueryHandler` |
| `GetReleaseListingController` | `GetListingController` |
| `GetReleaseListingQuery` / `QueryHandler` | `GetListingQuery` / `GetListingQueryHandler` |
| `GetReleaseStatisticController` | `GetStatisticController` |
| `GetReleaseStatisticQuery` / `QueryHandler` | `GetStatisticQuery` / `GetStatisticQueryHandler` |
| `GetReleaseCommand` / `GetReleaseCommandHandler` | `GetReleaseQuery` / `GetReleaseQueryHandler` |

Result type aliases rename with handlers (e.g. `GetReleaseListingResult` → `GetListingResult`).

**HTTP routes after T4 (intentional breaking change vs spec 010):**

| Method | Before | After |
|---|---|---|
| GET | `/release/:id` | `/release?id=` |
| GET | `/community/rating/release/:releaseId` | `/community/rating/release?releaseId=` |
| GET | `/release/listing/:listingId` | `/release/listing?listingId=` |
| GET | `/release/statistic?releaseId=` | unchanged |
| GET | `/release/batch?from=&till=` | unchanged |

Controller path prefixes (`@Controller(...)`) stay the same; only `:param` segments become query strings.

## Constraints

**Must:**

- Update every import, module registration, and spec file that references renamed symbols
- Use `QueryBus` / `@QueryHandler` for `GetRelease` after T2 (read-only)
- Run `npm run build && npm run test && npm run test:e2e` before marking each task done

**Must not:**

- Add npm dependencies
- Change Discogs port methods, adapter logic, or response shapes (`unknown` passthrough)
- Rename `GetReleaseController`, `GetReleasesInBatchController`, or batch/community route prefixes beyond T4 query migration
- Use `jest.fn()` in new or touched handler unit tests

**Out of scope:**

- Renaming `GetReleasesInBatch*` types
- Typed Discogs DTOs
- Changing `shared/` or infrastructure code
- Updating historical specs under `specs/00x-*` (only this spec and code/tests)

## Tasks

### T1: Rename classes and files (community rating, listing, statistic)

**Do:**

1. **Release — community rating** (`git mv` + symbol renames):
   - `get-release-community-rating.controller.ts` → `get-community-rating.controller.ts` — `GetCommunityRatingController`
   - `get-release-community-rating.query.ts` → `get-community-rating.query.ts` — `GetCommunityRatingQuery`
   - `get-release-community-rating.query-handler.ts` → `get-community-rating.query-handler.ts` — `GetCommunityRatingQueryHandler`, `GetCommunityRatingResult`
   - `get-release-community-rating.query-handler.spec.ts` → `get-community-rating.query-handler.spec.ts`

2. **Market — listing**:
   - `get-release-listing.controller.ts` → `get-listing.controller.ts` — `GetListingController`
   - `get-release-listing.query.ts` → `get-listing.query.ts` — `GetListingQuery`
   - `get-release-listing.query-handler.ts` → `get-listing.query-handler.ts` — `GetListingQueryHandler`, `GetListingResult`
   - `get-release-listing.query-handler.spec.ts` → `get-listing.query-handler.spec.ts`

3. **Market — statistic**:
   - `get-release-statistic.controller.ts` → `get-statistic.controller.ts` — `GetStatisticController`
   - `get-release-statistic.query.ts` → `get-statistic.query.ts` — `GetStatisticQuery`
   - `get-release-statistic.query-handler.ts` → `get-statistic.query-handler.ts` — `GetStatisticQueryHandler`, `GetStatisticResult`
   - `get-release-statistic.query-handler.spec.ts` → `get-statistic.query-handler.spec.ts`

4. Update `release-web.module.ts`, `release-application.module.ts`, `market-web.module.ts`, `market-application.module.ts`, and all imports in controllers/handlers/specs.

**Files:** all paths in steps 1–4 above

**Verify:** `npm run build && npm run test` — HTTP routes and behavior unchanged (path params still in use)

---

### T2: Switch GetRelease from command to query

**Do:**

1. Rename application layer:
   - `get-release.command.ts` → `get-release.query.ts` — `GetReleaseQuery` (keep constructor property `releaseId`)
   - `get-release.command-handler.ts` → `get-release.query-handler.ts` — `GetReleaseQueryHandler` with `@QueryHandler(GetReleaseQuery)` and `IQueryHandler`
   - `get-release.command-handler.spec.ts` → `get-release.query-handler.spec.ts`

2. Update `get-release.controller.ts`: `CommandBus` → `QueryBus`, `GetReleaseCommand` → `GetReleaseQuery`, `execute(new GetReleaseQuery(id))`.

3. Update `release-application.module.ts`: register `GetReleaseQueryHandler` instead of `GetReleaseCommandHandler`.

4. Grep for `GetReleaseCommand`, `CommandHandler` under `src/release/` — no matches.

**Files:** `src/release/application/get-release.*`, `src/release/web/get-release.controller.ts`, `src/release/application/release-application.module.ts`

**Verify:** `npm run build && npm run test && npm run test:e2e` — `GET /release/:id` e2e in `test/release.e2e-spec.ts` still passes

---

### T3: Fix Swagger API tags by domain

**Do:**

1. Ensure all controllers under `src/release/web/` use `@ApiTags('release')` (already true today; confirm after T1 renames).

2. Change market controllers to `@ApiTags('market')`:
   - `GetListingController` in `get-listing.controller.ts`
   - `GetStatisticController` in `get-statistic.controller.ts`

3. Manual check: start app (or use `configureApp` + `GET /api-json`), confirm OpenAPI groups **release** (health excluded) vs **market** — no market operation under the release tag.

**Files:** `src/market/web/get-listing.controller.ts`, `src/market/web/get-statistic.controller.ts`

**Verify:** `npm run build` and manual: Swagger UI at `/api` shows listing and statistic under **market**, release/community/batch under **release**

---

### T4: Move path parameters to query parameters

**Do:**

1. **`GetReleaseController`** (`src/release/web/get-release.controller.ts`):
   - `@Get(':id')` → `@Get()` (same `@Controller('release')`; does not conflict with `batch` or `statistic` routes)
   - `@Param('id')` → `@Query('id')`
   - `@ApiParam` → `@ApiQuery` (`name: 'id'`, `required: true`)

2. **`GetCommunityRatingController`**:
   - `@Get(':releaseId')` → `@Get()`
   - `@Param('releaseId')` → `@Query('releaseId')`
   - `@ApiParam` → `@ApiQuery`

3. **`GetListingController`**:
   - `@Get(':listingId')` → `@Get()`
   - `@Param('listingId')` → `@Query('listingId')`
   - `@ApiParam` → `@ApiQuery`

4. Update e2e:
   - `test/release.e2e-spec.ts`: `.get('/release/12345')` → `.get('/release').query({ id: '12345' })`; community rating similarly with `.query({ releaseId: '12345' })`
   - `test/market.e2e-spec.ts`: listing → `.get('/release/listing').query({ listingId: '98765' })`

5. Grep `src/` and `test/` for `@Param` on these three controllers — none left.

**Files:** three controllers above, `test/release.e2e-spec.ts`, `test/market.e2e-spec.ts`

**Verify:** `npm run build && npm run test && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] No files named `get-release-listing*`, `get-release-statistic*`, `get-release-community-rating*`, or `get-release.command*`
- [ ] `GetRelease` flow uses `QueryBus` / `@QueryHandler` only
- [ ] Swagger: market endpoints tagged **market**; release endpoints tagged **release**
- [ ] All ID-based GETs use query params per table in **Context**
- [ ] `rg 'GetReleaseListing|GetReleaseStatistic|GetReleaseCommunityRating|GetReleaseCommand' src/ test/` returns no matches

## Implementation notes

**Fresh session prompt:** `Read specs/011-rename-files.md and implement T1` (then T2, T3, T4 in separate sessions/commits).

**Suggested commits:** `T1: rename community rating listing statistic types`, `T2: use query handler for get release`, `T3: fix swagger tags for market`, `T4: move path params to query params`
