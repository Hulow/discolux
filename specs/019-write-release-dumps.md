# Write releases from Discogs XML dump to Mongo

## Why

Spec 018 added a streaming script that reads the monthly dump (`data/discogs_20260501_releases.xml`) and prints NDJSON. Operators still need those rows in Mongo without calling the Discogs API for every ID. A single-record upsert endpoint plus a script mode that POSTs each parsed release closes the loop from dump file to database.

## What

1. **`POST /release/upsert`** — JSON body with dump fields; persists via command handler + existing `ReleaseRepository.upsertReleases`.
2. **`UpsertReleaseCommand` + `UpsertReleaseCommandHandler`** — map body → `ReleaseEntity` (dump fields only) and upsert.
3. **Extend `scripts/read-discogs-releases.ts`** — when `--api-url` is set, stream the XML and POST each release to the API instead of printing NDJSON.

Example body (title may appear in parser output but is **not** stored):

```json
{
  "id": 7892996,
  "country": "Canada",
  "released": "1969-05-00",
  "genres": ["Rock", "Folk, World, & Country"],
  "styles": ["Acoustic", "Psychedelic Rock", "Folk"]
}
```

Depends on spec 016/017 (`ReleaseRepository.upsertReleases`, Mongo `releases` collection) and spec 018 (`scripts/lib/stream-releases.ts`, `ParsedRelease`).

## Context

**Relevant files:**
- `scripts/lib/parsed-release.ts` — `{ id, title?, country?, released?, genres?, styles? }` from XML
- `scripts/read-discogs-releases.ts` — CLI; add persist mode here
- `src/release/application/ports/release-repository.port.ts` — `upsertReleases` (already exists)
- `src/release/infrastructure/mongo/release.repository.ts` — upsert via `bulkWrite`; stub vs full entity logic (`isStubEntity`)
- `src/release/domain/release.entity.ts` — optional `country`, `released`, `genres`, `styles` (no `title` field)
- `src/release/web/process-releases-in-batch.controller.ts` — `ApiKeyGuard`, `@HttpCode(204)`, Swagger patterns
- `src/release/application/process-releases-in-batch.command-handler.ts` — parallel for command + repository inject style
- `src/release/application/release-application.module.ts` — register new handler
- `src/release/web/release-web.module.ts` — register new controller
- `test/release.e2e-spec.ts` — extend with POST upsert cases; Mongo via in-memory server
- `test/fixtures/releases-sample.xml` — small file for script + manual API checks

**Patterns to follow:**
- `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc` — `Controller → CommandBus → Command → Handler → ReleaseEntity → ReleaseRepository`
- One controller per operation; DTO colocated under `src/release/web/` (`.cursor/rules/api-layer.mdc`)
- Handler unit tests with stubbed `ReleaseRepository` (`.cursor/rules/application-command.mdc`, `.cursor/rules/testing-unit.mdc`)
- E2e: auth + one happy path + one validation failure (`.cursor/rules/testing-e2e.mdc`)

**Key decisions:**
- Route: `POST /release/upsert` (singular `release`, same prefix as existing API)
- **Do not persist `title`** — omit from command, entity, schema, mapper, and POST contract; script strips `title` before POST
- Upsert key: `releaseId` (= body `id`); same semantics as spec 017 (`$set` defined fields, `$setOnInsert` `_id` + `createdAt`, always update `updatedAt`)
- Dump ingest entity: `randomUUID()` for domain `id`; set `releaseId`, optional `country` / `released` / `genres` / `styles`, `createdAt` / `updatedAt` = `new Date()`
- Re-upserting the same `releaseId` merges dump fields; does not `$unset` fields from a prior Discogs batch ingest (repository only `$set`s defined keys)
- HTTP: `204 No Content` on success
- Auth: `x-api-key` via `ApiKeyGuard` (same as other release endpoints)
- Validation at API boundary: `id` required, integer, ≥ 1; optional `country` (string), `released` (string), `genres` / `styles` (string arrays); reject unknown body keys if using a strict DTO
- Script: Node built-in `fetch` only (no new HTTP dependency); `--api-url` base URL (e.g. `http://localhost:3000`); API key from `--api-key` or `process.env.API_KEY`; when `--api-url` is omitted, keep current NDJSON-on-stdout behavior unchanged
- Script errors: non-2xx POST → log `releaseId` + status to stderr, continue; `process.exit(1)` after the stream if any POST failed

## Constraints

**Must:**
- Register `UpsertReleaseCommandHandler` in `ReleaseApplicationModule` and controller in `ReleaseWebModule`
- Unit-test handler: maps command fields to entity; calls `upsertReleases` once with one entity
- E2e: `401` without API key; `400` for missing/invalid `id`; happy path `204` + document in Mongo with expected dump fields
- Script change stays under `scripts/`; still streams file (no full-file load)
- `npm run build && npm run test && npm run test:e2e` passes

**Must not:**
- Add `title` to domain entity, Mongo schema, or mapper
- Import `src/` from `scripts/` (HTTP bridge only)
- Change `GET /release` or `POST /release/batch` behavior
- Call Discogs API from the upsert flow
- Commit or CI-load the 57 GB dump file

**Out of scope:**
- Bulk/array upsert endpoint (one release per request)
- Background job queue or rate limiting
- Resumable checkpoint / offset into the dump
- Reading releases back from Mongo via new HTTP endpoints
- Unique index on `releaseId`

## Tasks

### T1: `UpsertReleaseCommand` and handler

**Do:**
1. Add `upsert-release.command.ts` — `id: number`, optional `country`, `released`, `genres`, `styles` (no `title`).
2. Add `upsert-release.command-handler.ts`:
   - `@CommandHandler(UpsertReleaseCommand)`, inject `RELEASE_REPOSITORY`
   - Build `ReleaseEntity` with `releaseId: command.id` and dump fields; `randomUUID()` + timestamps
   - `await this.releaseRepository.upsertReleases([entity])`
3. Add `upsert-release.command-handler.spec.ts` — assert entity fields and single `upsertReleases` call (use example IDs/arrays from fixture).
4. Register handler in `ReleaseApplicationModule`.

**Files:**
- `src/release/application/upsert-release.command.ts`
- `src/release/application/upsert-release.command-handler.ts`
- `src/release/application/upsert-release.command-handler.spec.ts`
- `src/release/application/release-application.module.ts`

**Verify:** `npm run build && npm run test -- upsert-release.command-handler.spec`

### T2: `POST /release/upsert` controller and e2e

**Do:**
1. Add `upsert-release.dto.ts` (colocated with controller) — transport shape + validation decorators for body fields above.
2. Add `upsert-release.controller.ts`:
   - `@Post('upsert')` on `@Controller('release')`, `@UseGuards(ApiKeyGuard)`, `@HttpCode(204)`
   - Map DTO → `UpsertReleaseCommand`, `CommandBus.execute`
   - Swagger: `@ApiOperation`, `@ApiBody`, `@ApiNoContentResponse`, `@ApiUnauthorizedResponse`, `@ApiBadRequestResponse`
3. Register controller in `ReleaseWebModule`.
4. Extend `test/release.e2e-spec.ts`:
   - `POST /release/upsert` → `401` without key
   - `400` when `id` missing or not an integer
   - Happy path: POST body from `test/fixtures/releases-sample.xml` release `id: 1` → `204`; assert Mongo doc has `releaseId: 1`, `country: 'Sweden'`, `genres`, `styles`, `released`

**Files:**
- `src/release/web/upsert-release.dto.ts`
- `src/release/web/upsert-release.controller.ts`
- `src/release/web/release-web.module.ts`
- `test/release.e2e-spec.ts`

**Verify:** `npm run build && npm run test:e2e -- release.e2e-spec`

### T3: Script persist mode

**Do:**
1. Extend `parseCliOptions` in `scripts/read-discogs-releases.ts` (or small `scripts/lib/cli-options.ts` if cleaner) with:
   - `--api-url <baseUrl>` (optional)
   - `--api-key <key>` (optional; default `process.env.API_KEY`)
2. When `--api-url` is set:
   - For each `ParsedRelease` from `streamReleases`, POST `{ id, country, released, genres, styles }` to `{apiUrl}/release/upsert` with header `x-api-key` and `Content-Type: application/json`
   - Do not send `title`
   - Respect `--limit` as today
3. When `--api-url` is omitted: existing `console.log(JSON.stringify(release))` behavior unchanged.
4. Add `scripts/read-discogs-releases.spec.ts` (or extend existing CLI tests) — mock `fetch`; assert URL, headers, and body shape for one parsed release.
5. Document usage in a one-line comment at top of `read-discogs-releases.ts` or in spec Done section (no new markdown file).

**Files:**
- `scripts/read-discogs-releases.ts`
- `scripts/read-discogs-releases.spec.ts` (new or extended)

**Verify:**
- `npm run test -- read-discogs-releases.spec`
- Manual (app running locally with `API_KEY` set):  
  `npm run read-releases -- --file test/fixtures/releases-sample.xml --limit 2 --api-url http://localhost:3000 --api-key "$API_KEY"`  
  then confirm 2 docs in Mongo with expected `releaseId` values

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `POST /release/upsert` with valid body + `x-api-key` returns `204` and upserts dump fields in Mongo
- [ ] Re-POST same `id` updates `updatedAt` and dump fields without duplicate `releaseId` rows
- [ ] `npm run read-releases -- --file test/fixtures/releases-sample.xml --limit 3` still prints NDJSON when `--api-url` is omitted
- [ ] Script with `--api-url` loads fixture releases into Mongo (manual with local server)
- [ ] No `title` field on stored documents; `GET /release` and `POST /release/batch` tests unchanged
