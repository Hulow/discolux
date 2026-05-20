# Write dumped releases from server-side XML stream

## Why

`scripts/dump-releases.ts` already streams `data/discogs_20260501_releases.xml` through `SaxReleaseParser` → `ReleaseExtractor` → `ReleaseBuilder`, but persistence today is either missing or routed through `POST /release/upsert` per-record. Operators need a single authenticated operation that ingests the monthly dump inside the app, reusing the same SAX pipeline, and writing to Mongo in bulk batches so the database is not called once per row.

## What

1. **Port the SAX pipeline** from `scripts/lib/release.{parser,extractor,builder}.ts` into `src/release/infrastructure/` (Nest injectable), without importing `scripts/` from `src/`.
2. **Replace** `POST /release/upsert` (body DTO) with **`POST /release/dump`**: no query params, no body; still guarded by `ApiKeyGuard` and `204 No Content` on success.
3. **Replace** `UpsertReleaseCommand` / `UpsertReleaseCommandHandler` with **`DumpReleaseCommand`** (empty payload is fine) and **`DumpReleaseCommandHandler`** that:
   - Resolves the dump XML path from config (e.g. `process.env.DISCOGS_RELEASES_XML_PATH`; document a sensible default or require the env in production).
   - Streams the file through the infrastructure parser.
   - For each completed `<release>`, applies the **same genre rule as spec 020**: only enqueue rows whose `genres` is **exactly** `['Electronic']` (single element, exact spelling).
   - Maps each accepted row to `ReleaseEntity` using the same field semantics as the former upsert handler: `randomUUID()` for domain `id`, `releaseId` from the dump `id` attribute (parse to integer), optional `country`, `released`, `genres`, `styles`, `notes` when the XML pipeline produces them, `createdAt` / `updatedAt` = `new Date()` at upsert time.
   - Calls `releaseRepository.upsertReleases` **each time the batch reaches 5000 entities**, and again for any **remainder** after the stream ends.
4. **Wire** a small application **port** (e.g. `RELEASE_DUMP_XML_STREAMER` + interface) implemented by the infrastructure module so the handler stays testable with a stub.

**Breaking:** Clients and docs that used `POST /release/upsert` must switch to `POST /release/dump` and run ingest on the server; per-record JSON upsert is removed.

## Context

**Relevant files (expect to touch):**
- `scripts/lib/release.parser.ts` — reference for porting `SaxReleaseParser`
- `scripts/lib/release.extractor.ts` — reference; today filters with `genres.includes('Electronic')`; **persistence must use spec-020 exact `['Electronic']` logic**
- `scripts/lib/release.builder.ts` — reference; ensure **`released`** (and any other fields needed for parity with `ReleaseEntity` / former upsert) are captured from the XML
- `scripts/dump-releases.ts` — may become a thin HTTP client that `POST`s `/release/dump` (recommended) so parser code does not exist in two places
- `src/release/application/ports/release-repository.port.ts` — `upsertReleases` batch API (already supports arrays)
- `src/release/infrastructure/mongo/release.repository.ts` — `bulkWrite` batching
- `src/release/domain/release.entity.ts` — dump fields; `notes` exists if you map it from XML
- `src/release/application/upsert-release.command*.ts`, `src/release/web/upsert-release.*` — **rename/replace** with dump names and new route
- `src/release/application/release-application.module.ts`, `src/release/web/release-web.module.ts` — register new handler/controller + infrastructure providers
- `test/release.e2e-spec.ts` — replace `/release/upsert` cases with `/release/dump`; set `DISCOGS_RELEASES_XML_PATH` (or chosen env name) to `test/fixtures/releases-sample.xml` before `POST`
- `test/fixtures/releases-sample.xml` — release `1` = Electronic-only; `2` = Electronic+Techno (skip); `3` = no genres (skip)

**Patterns to follow:**
- `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc` — `Controller → CommandBus → Command → Handler → ports → infrastructure`
- `.cursor/rules/api-layer.mdc` — one controller per operation, Swagger on the new route
- `.cursor/rules/application-command.mdc` — business rules and batching in the handler; infrastructure does I/O and SAX only
- `.cursor/rules/infrastructure-persistence.mdc` — keep filesystem + SAX out of the handler’s concrete imports (use a port)

**Key decisions:**
- Route: `POST /release/dump` (kebab-case segment; no body)
- Auth: unchanged (`x-api-key`, `204` on success)
- Batch size: **5000** persisted rows per `upsertReleases` call (count **after** Electronic-only filter)
- Genre filter: **exactly** `['Electronic']` (spec 020), not `includes('Electronic')`
- Dump path: **environment variable** read via `ConfigService` / `process.env` (pick one name and document it in the spec Done section)
- Do **not** persist release **title** / `name` from XML (spec 019: no title on stored documents) unless you explicitly extend domain + schema in a follow-up spec
- **Long-running request:** Streaming the real multi-GB file may exceed HTTP timeouts; document operational expectations (proxy timeouts, running locally, or future async job — out of scope unless you add `202` + job id in this spec’s Tasks)

## Constraints

**Must:**
- Parser implementation lives under `src/release/infrastructure/` (new folder, e.g. `dump/`)
- `DumpReleaseCommandHandler` injects `RELEASE_REPOSITORY` and the new dump streamer port (and `ConfigService` if used for the path)
- Batch flush at 5000 and final flush for remainder
- Unit-test the handler: stub streamer emits N Electronic-only releases → verify `upsertReleases` call count and batch sizes (include a case with remainder ≠ 0)
- E2e: `POST /release/dump` returns `401` without key; with fixture path set, `204` and Mongo contains expected Electronic-only rows from the fixture (e.g. `releaseId: 1`), and does **not** write skipped IDs from the same fixture
- `npm run build && npm run test && npm run test:e2e` passes
- Do **not** import `src/` from `scripts/` (if the script remains, it uses HTTP only)

**Must not:**
- Leave `POST /release/upsert` and the old DTO/command/handler names in production code paths (replace them as part of this feature)
- Change unrelated release endpoints (`GET /release`, batch Discogs ingest, etc.)
- Commit or CI-load the full multi-GB dump file

**Out of scope:**
- Resumable checkpoints / offset into the file
- Background job queue, progress reporting, or `202 Accepted` unless explicitly added in a Task
- Rate limiting or parallel workers
- Unique index changes

## Tasks

### T1: Infrastructure SAX pipeline + port

**Do:**
1. Add `src/release/application/ports/release-dump-xml-streamer.port.ts` (name may vary) defining something like `streamFromPath(path: string, onRelease: (row: ParsedDumpRelease) => void): Promise<void>` (or async iterator — pick one pattern and use it consistently). Export a `Symbol` token for DI.
2. Under `src/release/infrastructure/dump/`, add typed builder/extractor/parser ported from `scripts/lib`, adapted so completed releases are delivered to the streamer (no `console.log` in domain path).
3. Ensure parsed rows include at least: numeric `releaseId`, `genres`, `styles`, `country`, `released` (add XML handling if missing), `notes` if available.
4. Add `ReleaseDumpInfrastructureModule` (or extend an existing infrastructure module) that provides the streamer implementation bound to the port token; export what `ReleaseApplicationModule` needs.
5. Add focused unit tests for the mapper **or** extractor edge cases if easy (optional if handler e2e coverage is sufficient — prefer at least one fast unit test on genre filtering helper if logic is extracted).

**Files (illustrative):**
- `src/release/application/ports/release-dump-xml-streamer.port.ts`
- `src/release/infrastructure/dump/*.ts`
- `src/release/infrastructure/dump/release-dump.module.ts`
- `src/app.module.ts` or `src/release/application/release-application.module.ts` — import new module as appropriate

**Verify:**
```bash
npm run build && npm run test
```

### T2: `DumpReleaseCommand`, handler, batching

**Do:**
1. Remove or rename `UpsertReleaseCommand` → `DumpReleaseCommand` (no constructor args required).
2. Replace `UpsertReleaseCommandHandler` with `DumpReleaseCommandHandler`:
   - `@CommandHandler(DumpReleaseCommand)`
   - Inject `RELEASE_REPOSITORY` + dump streamer port + path from config
   - Implement Electronic-only gate and `ReleaseEntity.from` mapping aligned with former upsert + spec 020
   - Buffer entities; call `upsertReleases` every **5000**; flush tail
3. Add `dump-release.command-handler.spec.ts` with stub streamer and stub repository asserting batch sizes.
4. Register handler in `ReleaseApplicationModule`; delete old upsert handler registration.

**Files:**
- `src/release/application/dump-release.command.ts`
- `src/release/application/dump-release.command-handler.ts`
- `src/release/application/dump-release.command-handler.spec.ts`
- `src/release/application/release-application.module.ts`
- Remove: `upsert-release.command.ts`, `upsert-release.command-handler.ts`, `upsert-release.command-handler.spec.ts` (or replace in-place with dump names if you prefer minimal git noise — but no duplicate handlers)

**Verify:**
```bash
npm run build && npm run test -- dump-release.command-handler.spec
```

### T3: `DumpReleaseController` + e2e migration

**Do:**
1. Replace `UpsertReleaseController` + `UpsertReleaseDto` with `DumpReleaseController`:
   - `@Post('dump')`, `@HttpCode(204)`, no `@Body`, no query
   - Swagger: operation summary describing full-file ingest; no `ApiBody`
2. Register controller in `ReleaseWebModule`.
3. Update `test/release.e2e-spec.ts`: remove `/release/upsert` tests; add `/release/dump` tests with env path to `test/fixtures/releases-sample.xml`.

**Files:**
- `src/release/web/dump-release.controller.ts`
- `src/release/web/release-web.module.ts`
- Delete `upsert-release.controller.ts`, `upsert-release.dto.ts`
- `test/release.e2e-spec.ts`

**Verify:**
```bash
npm run build && npm run test:e2e -- release.e2e-spec
```

### T4: Scripts alignment (recommended, same PR or follow-up commit)

**Do:**
1. Change `scripts/dump-releases.ts` to call `POST {baseUrl}/release/dump` with `x-api-key` (flags or env for base URL and key), **or** delete the script if unused.
2. Remove duplicate `scripts/lib/release.*` only if nothing else depends on them; if tests under `scripts/test/` cover the old copies, either migrate tests to `src/` or keep scripts as thin wrappers until migrated.

**Verify:**
```bash
npm run test -- scripts/test  # adjust to repo’s script test command if present
```

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `POST /release/dump` with `x-api-key` and valid `DISCOGS_RELEASES_XML_PATH` returns `204` and upserts **Electronic-only** rows in batches of up to 5000
- [ ] `POST /release/dump` returns `401` without key
- [ ] `POST /release/upsert` no longer exists; OpenAPI reflects `POST /release/dump` only
- [ ] No regressions on `GET /release` or other existing release endpoints
- [ ] Manual (local): point env at `test/fixtures/releases-sample.xml`, run app, call dump endpoint once, inspect Mongo for expected `releaseId` values
