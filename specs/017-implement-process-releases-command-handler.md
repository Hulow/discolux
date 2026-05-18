# Process releases in batch

## Why

`GET /release/batch` fetches releases from Discogs but does not persist them. Operators need a write path that ingests the same ID range into Mongo so releases are stored for later use (caching, pipelines, reprocessing) without calling Discogs on every read.

## What

Add a command-driven batch ingest flow:

- `POST /release/batch?from=&till=` — same query params and validation as `GET /release/batch` (`from`, `till`, inclusive range, max 60 IDs, API key)
- `ProcessReleasesInBatchCommand` + `ProcessReleasesInBatchCommandHandler` — fetch each ID from Discogs (same parallel pattern as `GetReleasesInBatchQueryHandler`), map outcomes to `ReleaseEntity`, upsert all into Mongo via `ReleaseRepository`
- On Discogs failure for an ID: upsert a stub entity with only `releaseId`, `createdAt`, and `updatedAt` (optional fields omitted / undefined); do not fail the whole batch
- On success: upsert the full `ReleaseEntity` returned by the Discogs client
- HTTP response: `204 No Content` on success (no body)

Depends on spec 016 (`ReleaseRepository`, Mongo schema/mapper) being merged.

## Context

**Relevant files:**
- `src/release/application/get-releases-in-batch.query-handler.ts` — batch ID loop, per-ID `.catch` → `BatchReleaseError` pattern to mirror
- `src/release/web/get-releases-in-batch.controller.ts` — `validateBatchRange`, `MAX_BATCH_SIZE`, Swagger/API-key patterns for the new POST controller
- `src/release/application/ports/release-repository.port.ts` — extend with upsert API
- `src/release/infrastructure/mongo/release.repository.ts` — implement upsert via Mongoose `bulkWrite`
- `src/release/infrastructure/discogs/mappers/release-entity.mapper.ts` — successful Discogs responses already become `ReleaseEntity` with `randomUUID()` id
- `src/release/domain/release.entity.ts` — stub entities still require `id`, `releaseId`, `createdAt`, `updatedAt`
- `src/release/application/release-application.module.ts` — register command handler
- `src/release/web/release-web.module.ts` — register new controller
- `test/release.e2e-spec.ts` — extend with POST cases; Mongo via `test/jest-e2e.setup.ts` (`mongodb-memory-server`)

**Patterns to follow:**
- First command in the codebase: use `@CommandHandler(ProcessReleasesInBatchCommand)` + `ICommandHandler`, inject ports via `Symbol` tokens (same as query handlers)
- Controller uses `CommandBus` (not `QueryBus`); one controller per operation (`.cursor/rules/api-layer.mdc`)
- Handler orchestrates only: Discogs client + repository; no Mongoose in application layer
- Reuse validation rules from `GetReleasesInBatchController` (copy `parseReleaseId` / `validateBatchRange` into the new controller, or extract to a small shared helper under `src/release/web/` if duplication is painful — do not change GET controller behavior)

**Key decisions:**
- Route: `POST /release/batch` (singular `release`, consistent with existing API)
- Upsert key: `releaseId` (indexed, non-unique in schema — use as `bulkWrite` filter)
- `_id` / domain `id`: set on insert only (`$setOnInsert`); preserve existing `_id` on re-upsert for the same `releaseId`
- `createdAt`: set on insert only; preserve on update
- `updatedAt`: always set on every upsert (`$set`)
- Successful fetch: `$set` all mapped scalar/array fields from the entity document
- Failed fetch: `$set` only `releaseId` and `updatedAt`; `$setOnInsert` `{ _id, releaseId, createdAt }` — do **not** `$unset` existing fields if a prior successful ingest populated them
- Stub entity factory (application or domain helper): `randomUUID()` for `id`, `releaseId` from range ID, `createdAt` / `updatedAt` = `new Date()`
- Keep existing `addReleases` / `insertMany` unchanged; add `upsertReleases` for this feature
- Do not change `GET /release/batch` response shape or handler logic

## Constraints

**Must:**
- Register handler in `ReleaseApplicationModule` and controller in `ReleaseWebModule`
- Unit-test command handler with stubbed `ReleaseDiscogsClient` and `ReleaseRepository` (no real Mongo in unit tests)
- Unit-test repository `upsertReleases` with mocked `Model.bulkWrite`
- E2e: auth + validation cases aligned with GET batch; at least one happy-path POST that asserts documents in Mongo (via `getModelToken(Release.name)` or equivalent)
- E2e unhappy path: when Discogs rejects one ID, POST still returns `204` and stub document exists for that `releaseId`

**Must not:**
- Import Mongoose into application/domain layers
- Return domain entities from the POST controller
- Fail the entire batch when one Discogs ID fails
- Refactor `GetReleasesInBatchQueryHandler` unless needed for a shared private helper (optional, not required)

**Out of scope:**
- Reading releases back from Mongo via HTTP
- Changing `addReleases` to upsert or removing `insertMany`
- Unique index on `releaseId`
- Background jobs / queues
- Response body listing per-ID outcomes (use logs/tests for verification)

## Tasks

### T1: Repository `upsertReleases`

**Do:**
1. Add `upsertReleases(releases: ReleaseEntity[]): Promise<void>` to `ReleaseRepository` port.
2. Implement in `release.repository.ts` using `bulkWrite` with `updateOne` + `upsert: true`, filter `{ releaseId: entity.releaseId }`.
3. Map each entity with `releaseEntityToDocument`; build update doc per decisions above (`$set` / `$setOnInsert` split for timestamps and `_id`).
4. No-op on empty array.
5. Extend `release.repository.spec.ts`: mock `bulkWrite`; assert empty input skips call; assert one full entity and one stub entity produce expected `bulkWrite` payloads.

**Files:**
- `src/release/application/ports/release-repository.port.ts`
- `src/release/infrastructure/mongo/release.repository.ts`
- `src/release/infrastructure/mongo/release.repository.spec.ts`

**Verify:** `npm run build && npm run test -- release.repository.spec`

### T2: `ProcessReleasesInBatchCommand` and handler

**Do:**
1. Add `process-releases-in-batch.command.ts` — holds `from` and `till` as strings (same as `GetReleasesInBatchQuery`).
2. Add `process-releases-in-batch.command-handler.ts`:
   - Inject `RELEASE_DISCOGS_CLIENT` and `RELEASE_REPOSITORY`
   - Build inclusive ID list from `from`/`till` (same loop as query handler)
   - `Promise.all` parallel fetches; on success use returned `ReleaseEntity`; on failure build stub entity for that numeric ID
   - Call `upsertReleases` once with the full array (success + stub entities)
   - Return `void`
3. Add `process-releases-in-batch.command-handler.spec.ts`:
   - Stub client resolves for `'1'` and `'3'`, rejects for `'2'`
   - Assert repository receives 3 entities in order; entity for ID 2 has only `releaseId` + timestamps (optional fields undefined)
   - Assert `upsertReleases` called once
4. Register handler in `ReleaseApplicationModule`.

**Files:**
- `src/release/application/process-releases-in-batch.command.ts`
- `src/release/application/process-releases-in-batch.command-handler.ts`
- `src/release/application/process-releases-in-batch.command-handler.spec.ts`
- `src/release/application/release-application.module.ts`

**Verify:** `npm run build && npm run test -- process-releases-in-batch.command-handler.spec`

### T3: `POST /release/batch` controller and e2e

**Do:**
1. Add `process-releases-in-batch.controller.ts`:
   - `@Post('batch')` on `@Controller('release')`
   - Same `from`/`till` query validation as GET batch
   - `CommandBus.execute(new ProcessReleasesInBatchCommand(from, till))`
   - `@HttpCode(204)`, Swagger (`@ApiOperation`, `@ApiQuery`, `@ApiNoContentResponse`, `@ApiSecurity`, `@ApiUnauthorizedResponse`)
2. Register controller in `ReleaseWebModule`.
3. Extend `test/release.e2e-spec.ts`:
   - `POST /release/batch` → `401` without key; `400` for `from > till` and range > 60
   - Happy path: `POST ?from=1&till=3` → `204`; assert 3 docs in `releases` collection with expected `releaseId` values
   - Upstream failure: override `getRelease` to reject for `'2'`; POST → `204`; assert doc for `releaseId: 2` exists with no `status` (or other optional field from successful stub), docs for 1 and 3 have full stub fields from e2e entity if applicable

**Files:**
- `src/release/web/process-releases-in-batch.controller.ts`
- `src/release/web/release-web.module.ts`
- `test/release.e2e-spec.ts`

**Verify:** `npm run build && npm run test:e2e -- release.e2e-spec`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `POST /release/batch?from=1&till=3` with valid API key returns `204` and upserts 3 Mongo documents
- [ ] When Discogs fails for one ID in range, POST still returns `204`; failed ID is stored as stub (`releaseId` + timestamps only on first insert)
- [ ] Re-running POST for the same range updates `updatedAt` without duplicate `releaseId` rows
- [ ] `GET /release/batch` behavior unchanged (no regressions in `test/release.e2e-spec.ts` GET cases)
