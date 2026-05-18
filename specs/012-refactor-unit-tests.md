# Refactor unit tests

## Why

Each query-handler unit test defines its own inline `MarketDiscogsClientStub` or `ReleaseDiscogsClientStub` with slightly different shapes (single-value setters vs per-ID maps and failure injection). That duplication makes batch-handler tests harder to align with simpler handlers and invites drift when ports change.

## What

Extract two shared test doubles in each domain’s infrastructure layer and point all handler unit specs at them.

**Done when:** `npm run test` passes, no inline `*DiscogsClientStub` classes remain in `src/**/application/*.spec.ts`, and each domain has exactly one stub file under `infrastructure/discogs/`.

## Context

**Relevant files:**

| Path | Role |
|---|---|
| `src/market/application/get-listing.query-handler.spec.ts` | Inline `MarketDiscogsClientStub` (`setListing`) |
| `src/market/application/get-statistic.query-handler.spec.ts` | Inline `MarketDiscogsClientStub` (`setStats`) |
| `src/release/application/get-release.query-handler.spec.ts` | Inline `ReleaseDiscogsClientStub` (`setRelease`) |
| `src/release/application/get-community-rating.query-handler.spec.ts` | Inline stub (`setRating`) |
| `src/release/application/get-releases-in-batch.query-handler.spec.ts` | Inline stub (`setRelease(id, …)`, `failRelease`) |
| `src/market/application/ports/market-discogs-client.port.ts` | `MarketDiscogsClient` interface |
| `src/release/application/ports/release-discogs-client.port.ts` | `ReleaseDiscogsClient` interface |
| `src/market/infrastructure/discogs/market-discogs.client.ts` | Production adapter (naming reference) |
| `src/release/infrastructure/discogs/release-discogs.client.ts` | Production adapter (naming reference) |

**Patterns to follow:**

- Class stub implementing the domain port — no `jest.fn()` (see existing handler specs and spec 011)
- Stub file name: `{domain}-discogs-client.stub.ts`, class name `{Domain}DiscogsClientStub`
- Co-locate with production client under `src/{domain}/infrastructure/discogs/`
- Import port type from `application/ports/`, implement interface on the stub class

**Key decisions already made:**

- Stubs live in **infrastructure**, not application (test doubles next to real HTTP adapters)
- **One stub per domain** — not per handler; unified setter API covers all current unit tests
- E2e tests keep inline `.useValue({ … })` overrides in `test/*.e2e-spec.ts` (out of scope)

**Unified stub APIs:**

`MarketDiscogsClientStub` — implement `MarketDiscogsClient`:

| Method | Behavior |
|---|---|
| `setListing(listing: unknown)` | `getMarketplaceListing` resolves to this value |
| `setStats(stats: unknown)` | `getReleaseMarketplaceStats` resolves to this value |
| Unset methods | Resolve to `null` |

`ReleaseDiscogsClientStub` — implement `ReleaseDiscogsClient`:

| Method | Behavior |
|---|---|
| `setRelease(release: unknown)` | Default payload for any ID when no per-ID entry exists |
| `setRelease(releaseId: string, release: unknown)` | Per-ID payload (batch tests) |
| `failRelease(releaseId: string, error: Error)` | `getRelease` rejects with that error for that ID |
| `setRating(rating: unknown)` | `getReleaseCommunityRating` resolves to this value |
| `getRelease` | Per-ID map → else default → else `null`; check failures first |
| Unset rating | `getReleaseCommunityRating` resolves to `null` |

Use TypeScript overloads or distinct method names (`setReleaseForId`) if overload ergonomics are awkward — prefer one public surface documented above.

## Constraints

**Must:**

- Stubs implement the full port interface (both methods each)
- Preserve existing test behavior and assertion payloads
- Run `npm run test` before marking each task done

**Must not:**

- Change production handlers, controllers, or modules
- Introduce `jest.fn()` / spies on port methods
- Refactor e2e stubs in this spec

**Out of scope:**

- `test/market.e2e-spec.ts` / `test/release.e2e-spec.ts`
- `src/shared/infrastructure/discogs/discogs-http.client.spec.ts`
- New dependencies or Nest testing-module wiring for unit tests (handlers stay constructed manually)

## Tasks

### T1: Add shared Discogs client stubs in infrastructure

**Do:**

1. Create `src/market/infrastructure/discogs/market-discogs-client.stub.ts` exporting `MarketDiscogsClientStub` with `setListing` / `setStats` as above.
2. Create `src/release/infrastructure/discogs/release-discogs-client.stub.ts` exporting `ReleaseDiscogsClientStub` with default + per-ID release configuration, `failRelease`, and `setRating` as above.

**Files:** new stub files only

**Verify:** `npm run build` (stubs compile against ports)

### T2: Wire market handler specs to shared stub

**Do:** Remove inline `MarketDiscogsClientStub` from:

- `src/market/application/get-listing.query-handler.spec.ts`
- `src/market/application/get-statistic.query-handler.spec.ts`

Import `MarketDiscogsClientStub` from `../infrastructure/discogs/market-discogs-client.stub` (adjust relative path as needed). Keep test bodies unchanged aside from stub construction.

**Files:** two market `*.spec.ts` files

**Verify:** `npm run test -- src/market/application`

### T3: Wire release handler specs to shared stub

**Do:** Remove inline `ReleaseDiscogsClientStub` from:

- `src/release/application/get-release.query-handler.spec.ts`
- `src/release/application/get-community-rating.query-handler.spec.ts`
- `src/release/application/get-releases-in-batch.query-handler.spec.ts`

Import `ReleaseDiscogsClientStub` from `../infrastructure/discogs/release-discogs-client.stub`. For `get-release` / `get-community-rating`, use `setRelease(release)` / `setRating(rating)` (default mode). For batch spec, use per-ID `setRelease(id, …)` and `failRelease` — behavior must match current tests.

**Files:** three release `*.spec.ts` files

**Verify:** `npm run test -- src/release/application`

## Done

- [ ] `npm run build && npm run test` pass
- [ ] `rg 'class (Market|Release)DiscogsClientStub' src/` matches only the two infra stub files
- [ ] No regressions in handler coverage (same `it(...)` cases and expectations as before)
