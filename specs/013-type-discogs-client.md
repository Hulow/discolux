# Type Discogs client

## Why

Bounded-context Discogs adapters (`ReleaseDiscogsClient`, `MarketDiscogsClient`) currently return raw `unknown` JSON from `DiscogsHttpClient`. Callers get no structure and no boundary between HTTP payloads and application code. Mapping at the infrastructure edge gives typed, predictable responses without validation logic in handlers.

## What

Add static mappers under each bounded context’s `infrastructure/discogs/mappers/` that transform `unknown` Discogs payloads into optional-field TypeScript interfaces. Wire mappers in the context-specific Discogs clients and update application ports (and handler result aliases) to return those types instead of `unknown`.

## Context

**Relevant files:**
- `src/release/infrastructure/discogs/release-discogs.client.ts` — delegates to `DiscogsHttpClient`; should map before return
- `src/release/infrastructure/discogs/mappers/release-discogs.mapper.ts` — Discogs release + community-rating response interfaces (add mapper class here)
- `src/release/application/ports/release-discogs-client.port.ts` — port return types to update
- `src/release/infrastructure/discogs/release-discogs-client.stub.ts` — stub used in handler unit tests
- `src/release/application/get-release.query-handler.ts`, `get-community-rating.query-handler.ts`, `get-releases-in-batch.query-handler.ts` — consumers of the port
- `src/market/infrastructure/discogs/market-discogs.client.ts` — same pattern for marketplace
- `src/market/infrastructure/discogs/mappers/market-discogs.mapper.ts` — listing + marketplace-stats interfaces (add mapper class here)
- `src/market/application/ports/market-discogs-client.port.ts` — port return types to update
- `src/shared/infrastructure/discogs/discogs-http.client.ts` — stays `Promise<unknown>`; no mapping here

**Patterns to follow:**
- Hexagonal: HTTP in shared infra, bounded-context client + mapper in feature infra, port in application (`003-implement-discogs-client.md`)
- Handler unit tests use concrete stubs (no `jest.fn()` in handler specs)
- Mapper is infrastructure-only; handlers keep delegating to the port unchanged aside from result types

**Key decisions already made:**
- Mapper is a simple static class; one method per Discogs response shape
- Target shapes are the existing `Discogs*Response` interfaces in each `*-discogs.mapper.ts` file (all fields optional)
- `DiscogsHttpClient` is unchanged; mapping runs in `ReleaseDiscogsClient` / `MarketDiscogsClient` after `await`
- Ports may `import type` from the mapper file for return signatures (external API DTOs co-located with the adapter)
- Missing or null payload fields map to `undefined` (omit coercion, no defaults)
- No runtime validation, no `throw`, no `zod`/new dependencies

**Mapper shape (example):**

```typescript
export class ReleaseDiscogsMapper {
  static fromDiscogsRelease(payload: unknown): DiscogsReleaseResponse {
    const source = asRecord(payload);
    return {
      id: optionalNumber(source?.id),
      title: optionalString(source?.title),
      // nested: map child objects the same way
    };
  }
}
```

Use small private helpers in the mapper file (e.g. `asRecord`, `optionalString`, `optionalNumber`) so `fromDiscogs` methods stay readable. Helpers must never throw; invalid values become `undefined`.

## Constraints

**Must:**
- Map every field declared on the corresponding `Discogs*Response` interface (and nested interfaces)
- Return `undefined` for absent, `null`, or unusable scalar values — never invent defaults
- Keep `DiscogsHttpClient` returning `unknown`
- Add focused unit tests for the mapper (happy path + missing/malformed fields)

**Must not:**
- Throw from mapper code paths
- Validate or narrow types at runtime (no `typeof` guards that reject data — only safe reads)
- Change HTTP URLs, auth, or error behavior of `DiscogsHttpClient`
- Map in query handlers or API controllers

**Out of scope:**
- Domain entities or business rules on Discogs data
- Swagger schema generation from mapped types
- Changing e2e stub payloads beyond type compatibility
- Collapsing release/market into a single shared mapper

## Tasks

### T1: Release Discogs mapper and client wiring

**Do:**
1. Add `ReleaseDiscogsMapper` to `release-discogs.mapper.ts` with:
   - `fromDiscogsRelease(payload: unknown): DiscogsReleaseResponse`
   - `fromDiscogsCommunityRating(payload: unknown): DiscogsReleaseCommunityRatingResponse`
2. Update `ReleaseDiscogsClient` to `await` HTTP then return mapped results.
3. Update `ReleaseDiscogsClient` port method return types; export/alias types from the mapper file as needed.
4. Update `GetReleaseResult`, `GetCommunityRatingResult`, and batch handler result types if they still use `unknown`.
5. Add `release-discogs.mapper.spec.ts` covering: full payload, empty `{}`, `null`/`undefined` payload, nested fields missing, wrong-type scalars (e.g. string where number expected → `undefined`).

**Files:**
- `src/release/infrastructure/discogs/mappers/release-discogs.mapper.ts`
- `src/release/infrastructure/discogs/mappers/release-discogs.mapper.spec.ts`
- `src/release/infrastructure/discogs/release-discogs.client.ts`
- `src/release/application/ports/release-discogs-client.port.ts`
- `src/release/application/get-release.query-handler.ts`
- `src/release/application/get-community-rating.query-handler.ts`
- `src/release/application/get-releases-in-batch.query-handler.ts` (only if result typing changes)

**Verify:** `npm run test -- release-discogs.mapper.spec.ts && npm run test -- release`

### T2: Market Discogs mapper and client wiring

**Do:**
1. Add `MarketDiscogsMapper` to `market-discogs.mapper.ts` with:
   - `fromDiscogsMarketplaceListing(payload: unknown): DiscogsMarketplaceListingResponse`
   - `fromDiscogsReleaseMarketplaceStats(payload: unknown): DiscogsReleaseMarketplaceStatsResponse`
2. Update `MarketDiscogsClient` to map after HTTP.
3. Update `MarketDiscogsClient` port return types and handler result aliases (`GetListingResult`, `GetStatisticResult`).
4. Add `market-discogs.mapper.spec.ts` with the same edge cases as T1.

**Files:**
- `src/market/infrastructure/discogs/mappers/market-discogs.mapper.ts`
- `src/market/infrastructure/discogs/mappers/market-discogs.mapper.spec.ts`
- `src/market/infrastructure/discogs/market-discogs.client.ts`
- `src/market/application/ports/market-discogs-client.port.ts`
- `src/market/application/get-listing.query-handler.ts`
- `src/market/application/get-statistic.query-handler.ts`

**Verify:** `npm run test -- market-discogs.mapper.spec.ts && npm run test -- market`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release/:id`, `GET /release/community-rating`, batch release endpoints return the same JSON shape as before (e2e stubs unchanged semantically)
- [ ] `GET /market/listing/:id` and release statistic endpoint unchanged at the HTTP layer
- [ ] No regressions in handler unit tests (stubs still satisfy typed ports)
