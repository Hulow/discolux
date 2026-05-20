# Fix dump release upsert and released date parsing

## Why

`DumpReleaseCommandHandler` upserts dump rows via `ReleaseRepository.upsertReleases`, but two persistence gaps block reliable ingest:

1. **Mongo document identity** — Upserts should assign a MongoDB `ObjectId` on insert without changing the domain-generated UUID `id` used today (`randomUUID()` in the handler).
2. **`released` shape** — Dump XML exposes `released` as either a year (`"1990"`) or a date (`"1900-03-01"`). The handler currently forwards the raw string; we need a normalized `Date` before mapping to `ReleaseEntity`.

## What

1. **Infrastructure `mongoId`** — On upsert insert, persist a new `mongoId` field (`ObjectId`) generated in `ReleaseRepository`. Keep domain `id` (UUID) as today; it still maps to document `_id` via `releaseEntityToDocument`.
2. **Application released-date mapper** — Parse dump `released` strings into `Date`:
   - Year-only (`/^\d{4}$/`) → `YYYY-01-01` at UTC midnight, then `Date`
   - `YYYY-MM-DD` → parse as UTC date
   - `null` / missing / unparseable → omit `released` on the entity (do not throw; skip bad values for that field only)
3. **`released` type** — Change `ReleaseEntity.released` and Mongo `released` from `string` to `Date` (optional). Update mappers and tests that assert string values.

## Context

**Relevant files:**
- `src/release/application/dump-release.command-handler.ts` — `toReleaseEntity`; wire released-date mapper here
- `src/release/application/dump-release.command-handler.spec.ts` — handler unit tests for date normalization
- `src/release/domain/release.entity.ts` — `released?: Date`
- `src/release/infrastructure/mongo/release.repository.ts` — `buildUpsertOperation`; add `mongoId` in `$setOnInsert`
- `src/release/infrastructure/mongo/release.schema.ts` — `mongoId` + `released` as `Date`
- `src/release/infrastructure/mongo/mappers/release.mapper.ts` — entity ↔ document mapping
- `src/release/infrastructure/mongo/release.repository.spec.ts` — assert `mongoId` in upsert payloads
- `src/release/infrastructure/mongo/release.repository.integration.spec.ts` — round-trip `released` as `Date`
- `src/release/infrastructure/discogs/mappers/release-entity.mapper.ts` — Discogs `released` string → `Date` (same normalization rules or shared helper)
- `src/release/infrastructure/mongo/mappers/release.mapper.spec.ts`, `release.entity.spec.ts`, `release-entity.mapper.spec.ts` — type updates
- `test/release.e2e-spec.ts` — only if fixtures/assertions reference `released` strings

**Patterns to follow:**
- `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc` — handler orchestrates; repository implements port; no Mongoose in application
- `.cursor/rules/infrastructure-persistence.mdc` — `mongoId` stays in schema/repository/mapper; not on `ReleaseEntity`
- `.cursor/rules/application-command.mdc` — released parsing lives in application (dedicated mapper module used by handler)
- Spec 017 upsert semantics unchanged: filter `{ releaseId }`, `$setOnInsert` for `_id` / `createdAt`, stub vs full entity branches
- Handler unit tests with stub repository (see `dump-release.command-handler.spec.ts`)

**Key decisions:**
- `mongoId` is **persistence-only** (not on `ReleaseEntity` or repository port)
- Generate `mongoId` with `new Types.ObjectId()` inside `buildUpsertOperation` `$setOnInsert` (both stub and full upsert paths)
- Domain `id` remains UUID from `randomUUID()` in dump handler; document `_id` continues to equal `entity.id`
- Released-date helper: `src/release/application/parse-released-date.ts` exporting `parseReleasedDate(value: string | null | undefined): Date | undefined`
- UTC parsing: treat normalized date strings as UTC (`Date.parse(`${iso}T00:00:00.000Z`)` or equivalent)
- Year-only example: `"1990"` → `1990-01-01T00:00:00.000Z`
- Do **not** change Electronic-only filter (`genres.includes('Electronic')` as implemented today)
- Remove debug `console.log` in `DumpReleaseCommandHandler` if still present

## Constraints

**Must:**
- Add `mongoId` only in infrastructure (schema, repository upsert, document mapper types if needed for tests)
- Keep `ReleaseEntity.id` and upsert filter key `releaseId` unchanged
- Unit-test `parseReleasedDate` for year-only, full date, null, and invalid input
- Unit-test repository upsert: `$setOnInsert` includes `mongoId` (use `expect.any` or capture ObjectId shape)
- Update existing specs that hard-code `released: '1984'` strings to `Date` instances

**Must not:**
- Replace domain UUID `id` with `mongoId` or expose `mongoId` on the domain model
- Add new npm dependencies
- Change batch size (5000), dump route, or genre filter behavior
- Refactor unrelated release flows beyond `released` type alignment (Discogs/batch mappers only as needed for compile)

**Out of scope:**
- Mongo migration script for existing documents (additive field; old rows may lack `mongoId` until re-upserted)
- Normalizing exotic Discogs values (e.g. `"1999-03-00"`, month-only `"1999-03"`) unless trivially handled by the same `YYYY-MM-DD` path
- `POST /release/dump` contract or env var changes
- Backfilling `mongoId` on documents that already exist without re-running dump

## Tasks

### T1: Persist `mongoId` on upsert insert

**Do:**
1. Add optional `mongoId` to `Release` schema (`@Prop({ type: mongoose.Schema.Types.ObjectId })`).
2. Extend `ReleaseDocumentData` in `release.mapper.ts` with optional `mongoId`.
3. In `buildUpsertOperation`, add `mongoId: new Types.ObjectId()` to `$setOnInsert` for both stub and full upsert branches (do not add to `$set` on update).
4. Update `release.repository.spec.ts` expectations for `bulkWrite` payloads.

**Verify:**
```bash
npm run build && npm run test -- release.repository.spec
```

### T2: `parseReleasedDate` application mapper

**Do:**
1. Add `src/release/application/parse-released-date.ts` with `parseReleasedDate`.
2. Add `parse-released-date.spec.ts` covering:
   - `'1990'` → `Date` for `1990-01-01` UTC
   - `'1900-03-01'` → matching UTC date
   - `null` / `undefined` / `''` → `undefined`
   - garbage string → `undefined`

**Verify:**
```bash
npm run test -- parse-released-date.spec
```

### T3: `released` as `Date` + wire dump handler

**Do:**
1. Change `released?: string` → `released?: Date` on `ReleaseEntity` / props.
2. Update mongo schema (`Date`), `release.mapper.ts`, and Discogs `release-entity.mapper.ts` to map string → `Date` via `parseReleasedDate` (import from application or extract shared pure function to `domain/` only if import direction blocks — prefer duplicating thin call in Discogs mapper over violating layer rules).
3. In `dump-release.command-handler.ts`, use `parseReleasedDate(row.released)` in `toReleaseEntity`.
4. Update `dump-release.command-handler.spec.ts`: year-only and full-date cases; drop expectation for raw `'1999-03-00'` unless you explicitly support it.
5. Fix compile/test fallout in entity specs, mapper specs, integration spec.

**Verify:**
```bash
npm run build && npm run test -- dump-release.command-handler.spec release.entity.spec release.mapper.spec release-entity.mapper.spec
```

### T4: Integration check (optional but recommended)

**Do:**
1. Extend `release.repository.integration.spec.ts`: upsert stub entity, assert stored doc has `mongoId` and `released` as `Date` when provided.

**Verify:**
```bash
npm run test -- release.repository.integration.spec
```

## Done

- [ ] `npm run build` passes
- [ ] `npm run test` passes (or targeted specs above)
- [ ] `POST /release/dump` e2e still returns `204` with fixture XML (`test/release.e2e-spec.ts`)
- [ ] Manual: after dump, Mongo document for a new `releaseId` has `mongoId` (ObjectId) and `released` as BSON date when XML had `released`
- [ ] Re-upsert same `releaseId` preserves existing `_id` and does not overwrite `mongoId` (`$setOnInsert` only)
