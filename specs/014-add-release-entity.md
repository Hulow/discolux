# Add release entity

## Why

`ReleaseDiscogsClient.getRelease` and handlers currently expose `DiscogsReleaseResponse` — an infrastructure DTO with snake_case, optional fields, and Discogs-specific nesting (`community`, `date_added`, etc.). A domain entity gives the release bounded context a stable, camelCase model for application code and future persistence, without pushing HTTP mapping concerns into handlers.

## What

Introduce `ReleaseEntity` in `src/release/domain/` using a private constructor and `static from(props)`. Map `DiscogsReleaseResponse` → entity at the infrastructure edge in `ReleaseDiscogsClient.getRelease`. Wire the port, client, stub, and consumers so `getRelease` returns `ReleaseEntity` instead of `DiscogsReleaseResponse`.

## Context

**Relevant files:**
- `src/release/domain/` — empty today (`.gitkeep` only); add entity here
- `src/release/infrastructure/discogs/mappers/release-discogs.mapper.ts` — `DiscogsReleaseResponse` source shape (post–spec 013)
- `src/release/infrastructure/discogs/release-discogs.client.ts` — map DTO → entity after HTTP + mapper
- `src/release/application/ports/release-discogs-client.port.ts` — `getRelease` return type
- `src/release/infrastructure/discogs/release-discogs-client.stub.ts` — unit-test double
- `src/release/application/get-release.query-handler.ts` — passes through port result
- `src/release/application/get-releases-in-batch.query-handler.ts` — also calls `getRelease` on the port
- `src/release/web/get-release.controller.ts` — serializes handler result as JSON (no DTO layer today)

**Patterns to follow:**
- Domain purity (`.cursor/rules/domain-layer.mdc`): no Nest, HTTP, or infrastructure imports in `domain/`
- Hexagonal boundary: infra mapper stays `unknown` → `DiscogsReleaseResponse`; entity assembly lives in infra (or a dedicated infra mapper) calling `ReleaseEntity.from`
- Handler unit tests: class stub implementing the port — no `jest.fn()` (`specs/012-refactor-unit-tests.md`)
- Entity identity: `id` is an internal UUID; `releaseId` is the Discogs release numeric id

**Field mapping (`DiscogsReleaseResponse` → entity props):**

| Entity property | Source |
|-----------------|--------|
| `id` | `crypto.randomUUID()` at creation (not from Discogs) |
| `releaseId` | `dto.id` (required when mapping from Discogs) |
| `status` | `dto.status` |
| `year` | `dto.year` |
| `url` | `dto.uri ?? dto.resource_url` |
| `communityHave` | `dto.community?.have` |
| `communityWant` | `dto.community?.want` |
| `ratingCount` | `dto.community?.rating?.count` |
| `ratingAverage` | `dto.community?.rating?.average` |
| `addedAt` | `dto.date_added` |
| `changedAt` | `dto.date_changed` |
| `numberForSale` | `dto.num_for_sale` |
| `lowestPrice` | `dto.lowest_price` |
| `country` | `dto.country` |
| `released` | `dto.released` |
| `notes` | `dto.notes` |
| `releaseFormatted` | `dto.released_formatted` |
| `genres` | `dto.genres` with `undefined` entries removed |
| `styles` | `dto.styles` with `undefined` entries removed |
| `blockedFromSale` | `dto.blocked_from_sale` |
| `createdAt` | `new Date()` at factory time |
| `updatedAt` | `new Date()` at factory time |

**Key decisions:**
- `ReleaseEntityProps` (or equivalent) lives in **domain**; infrastructure maps `DiscogsReleaseResponse` → props, then `ReleaseEntity.from(props)` — domain does not import the mapper file
- Use Node `crypto.randomUUID()` for `id` (no new dependency)
- Entity uses **public `readonly`** fields so Nest/Express JSON serialization works without a separate presenter in T2
- Absent optional DTO scalars become `undefined` on the entity (do not invent `0` / `''` defaults)
- `getReleaseCommunityRating` stays `DiscogsReleaseCommunityRatingResponse` (out of scope)
- **HTTP shape changes** for `GET /release` and batch success items: response becomes camelCase entity fields (no `title`, snake_case keys, etc.). Update e2e and handler specs in T2

**Entity shape (example):**

```typescript
export type ReleaseEntityProps = {
  id: string;
  releaseId: number;
  status?: string;
  year?: number;
  // ...remaining fields per mapping table
  createdAt: Date;
  updatedAt: Date;
};

export class ReleaseEntity {
  private constructor(/* public readonly fields */) {}

  static from(props: ReleaseEntityProps): ReleaseEntity {
    return new ReleaseEntity(props);
  }
}
```

## Constraints

**Must:**
- Keep `ReleaseDiscogsMapper` and `DiscogsHttpClient` unchanged (still `unknown` → `DiscogsReleaseResponse`)
- Place `ReleaseEntity` under `src/release/domain/`
- Map from Discogs DTO only in infrastructure (`release-discogs.client.ts` or `release-entity.mapper.ts` in infra)
- Add unit tests for `ReleaseEntity.from` and for Discogs → props mapping
- Update batch handler union type where it references `DiscogsReleaseResponse` for successful items

**Must not:**
- Import infrastructure or Nest into `domain/`
- Change `getReleaseCommunityRating` behavior or types in this spec
- Add ORM, persistence, or database migrations

**Out of scope:**
- Persisting releases
- Mapping community-rating endpoint to an entity
- Swagger schema describing every entity field (controller may keep `additionalProperties: true`)
- Collapsing release/market bounded contexts

## Tasks

### T1: Create release entity

**Do:**
1. Add `src/release/domain/release.entity.ts` with `ReleaseEntity`, `ReleaseEntityProps`, private constructor, and `static from(props)`.
2. Expose all listed properties as `public readonly` on the instance.
3. Add `src/release/domain/release.entity.spec.ts`: `from` builds instance with given props; `id` / `createdAt` / `updatedAt` round-trip; genres/styles arrays are stored as provided.

**Files:**
- `src/release/domain/release.entity.ts`
- `src/release/domain/release.entity.spec.ts`
- Remove `src/release/domain/.gitkeep` if no longer needed

**Verify:** `npm run test -- release.entity.spec.ts`

### T2: Return entity from `ReleaseDiscogsClient.getRelease`

**Do:**
1. Add infrastructure mapper `discogsReleaseToEntityProps(dto: DiscogsReleaseResponse): ReleaseEntityProps` (co-locate in `release-discogs.client.ts` or `infrastructure/discogs/mappers/release-entity.mapper.ts`). Apply mapping table; set `id` via `randomUUID()`, `createdAt`/`updatedAt` to `new Date()`. If `dto.id` is missing, throw `Error` with a clear message (only validation throw in this feature).
2. Update `ReleaseDiscogsClient.getRelease` to: HTTP → `ReleaseDiscogsMapper.fromDiscogsRelease` → props → `ReleaseEntity.from`.
3. Change port `getRelease` return type to `Promise<ReleaseEntity>`.
4. Update `ReleaseDiscogsClientStub` to store/return `ReleaseEntity` (add `setReleaseEntity` or map stored DTOs through the same infra mapper in the stub).
5. Update `GetReleaseResult`, `GetReleaseQueryHandler` spec, and `GetReleasesInBatchResult` / batch handler spec for `ReleaseEntity` success items.
6. Update `test/release.e2e-spec.ts` (and any batch e2e assertions) to expect camelCase entity JSON for successful `GET /release` and batch items.

**Files:**
- `src/release/infrastructure/discogs/release-discogs.client.ts`
- `src/release/infrastructure/discogs/mappers/release-entity.mapper.ts` (optional)
- `src/release/infrastructure/discogs/mappers/release-entity.mapper.spec.ts` (if mapper extracted)
- `src/release/application/ports/release-discogs-client.port.ts`
- `src/release/infrastructure/discogs/release-discogs-client.stub.ts`
- `src/release/application/get-release.query-handler.ts`
- `src/release/application/get-release.query-handler.spec.ts`
- `src/release/application/get-releases-in-batch.query-handler.ts`
- `src/release/application/get-releases-in-batch.query-handler.spec.ts`
- `test/release.e2e-spec.ts`

**Verify:** `npm run test -- release && npm run test:e2e -- release.e2e-spec.ts`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release?id=` returns camelCase entity fields (e.g. `releaseId`, `communityHave`) with valid API key
- [ ] Batch release endpoint success entries use the same entity shape; error entries unchanged
- [ ] `GET /community/rating/release` unchanged
- [ ] No regressions in market bounded context tests
