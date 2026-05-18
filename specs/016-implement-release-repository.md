# Implement release repository

## Why

Mongo is connected (`SharedMongoModule`, spec 015). Release data from Discogs is modeled as `ReleaseEntity`, but nothing persists it yet. A repository port and Mongoose adapter establish the persistence boundary so later use cases (batch ingest, caching, read models) can store releases without leaking ORM types into application or domain.

## What

Add a `ReleaseRepository` application port and a Mongo infrastructure adapter under the release module:

- `src/release/application/ports/release-repository.port.ts` — port interface + injection token
- `src/release/infrastructure/mongo/` — Mongoose schema, domain ↔ document mapper, repository implementation, Nest module
- `addReleases(releases: ReleaseEntity[]): Promise<void>` — bulk persist domain entities
- Register the module so the adapter is injectable (not yet called from query handlers)

## Context

**Relevant files:**
- `src/release/domain/release.entity.ts` — fields to persist (`ReleaseEntity` / `ReleaseEntityProps`)
- `src/release/application/ports/release-discogs-client.port.ts` — port + `Symbol` token pattern
- `src/release/infrastructure/discogs/release-discogs.module.ts` — infra Nest module wiring (`provide` / `useClass` / `exports`)
- `src/release/infrastructure/discogs/mappers/release-entity.mapper.ts` — explicit mapper pattern (Discogs DTO → domain)
- `src/release/application/release-application.module.ts` — import new mongo module here
- `src/shared/infrastructure/mongo/shared-mongo.module.ts` — global `MongooseModule.forRoot`; feature modules use `forFeature`
- `specs/015-add-mongo-instance.md` — mongo memory setup for e2e; reuse for repository integration tests if needed

**Patterns to follow:**
- Port in `application/ports/`, implementation in `infrastructure/`
- Export token constant (e.g. `RELEASE_REPOSITORY`) and interface from port file
- Infra module: `imports: [MongooseModule.forFeature([{ name, schema }])]`, `providers: [{ provide: TOKEN, useClass: ReleaseRepository }]`, `exports: [TOKEN]`
- Map `ReleaseEntity` ↔ Mongoose document in a dedicated mapper file; repository must not return Mongoose documents
- `.cursor/rules/infrastructure-persistence.mdc`: no business logic in repository; no ORM types outside infrastructure

**Key decisions:**
- Collection name: `releases`
- Document `_id` uses domain `ReleaseEntity.id` (UUID string from mapper / entity)
- `releaseId` stored as `Number`, indexed (non-unique for now — duplicate handling is out of scope)
- `addReleases` uses `insertMany` on mapped documents; empty array is a no-op
- camelCase field names in Mongo documents (match `ReleaseEntity` property names)
- No migration tool in this spec; Mongoose creates the collection on first write

## Constraints

**Must:**
- Implement port in infrastructure; domain and application handlers do not import Mongoose
- Mirror all `ReleaseEntity` scalar/array fields in the schema (optional fields stay optional)
- Include `createdAt` / `updatedAt` as `Date` in schema
- Unit-test repository with mocked Mongoose `Model` (no real DB in unit tests per `.cursor/rules/testing-unit.mdc`)
- Import `ReleaseMongoModule` (name as implemented) in `ReleaseApplicationModule`

**Must not:**
- Change existing HTTP handlers, query handlers, or API response shapes
- Wire `addReleases` into batch/get release flows yet
- Add read/query methods (`findByReleaseId`, etc.) unless needed for tests
- Import infrastructure from domain

**Out of scope:**
- Command handlers calling `addReleases`
- Upsert / deduplication policy for duplicate `releaseId`
- Database migration scripts
- E2e tests that assert persisted data via API

## Tasks

### T1: Release repository port, schema, and adapter

**Do:**
1. Create `src/release/application/ports/release-repository.port.ts`:
   - `export const RELEASE_REPOSITORY = Symbol('RELEASE_REPOSITORY')`
   - `export interface ReleaseRepository { addReleases(releases: ReleaseEntity[]): Promise<void> }`
2. Create `src/release/infrastructure/mongo/release.schema.ts` — Mongoose schema class + `SchemaFactory` for `releases` collection, fields aligned with `ReleaseEntity`.
3. Create `src/release/infrastructure/mongo/mappers/release.mapper.ts`:
   - `releaseEntityToDocument(entity: ReleaseEntity)` (and reverse helper if useful for tests)
4. Create `src/release/infrastructure/mongo/release.repository.ts` — `@Injectable()` class implementing port; inject `@InjectModel(...)`; `addReleases` maps entities and calls `insertMany`.
5. Create `src/release/infrastructure/mongo/release-mongo.module.ts` — `forFeature`, provider binding, export `RELEASE_REPOSITORY`.
6. Import `ReleaseMongoModule` in `src/release/application/release-application.module.ts`.
7. Add `src/release/infrastructure/mongo/release.repository.spec.ts` — mock model; verify `addReleases([])` does not call `insertMany`; verify `addReleases([entity])` maps and calls `insertMany` with expected payload.

**Files:**
- `src/release/application/ports/release-repository.port.ts`
- `src/release/infrastructure/mongo/release.schema.ts`
- `src/release/infrastructure/mongo/mappers/release.mapper.ts`
- `src/release/infrastructure/mongo/release.repository.ts`
- `src/release/infrastructure/mongo/release-mongo.module.ts`
- `src/release/infrastructure/mongo/release.repository.spec.ts`
- `src/release/application/release-application.module.ts`

**Verify:** `npm run build && npm run test -- release.repository.spec`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `ReleaseRepository` port exists; `ReleaseRepository` implementation is registered and injectable via `RELEASE_REPOSITORY`
- [ ] `addReleases` bulk-writes mapped documents; unit spec covers empty and non-empty input
- [ ] No Mongoose imports in `domain/` or `application/` (except port file importing `ReleaseEntity` type only)
- [ ] No regressions in release/market e2e (handlers unchanged)
