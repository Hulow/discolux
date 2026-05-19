# Write upsert releases with Electronic genre only

## Why

The dump ingest path (`POST /release/upsert` and `read-discogs-releases.ts`) can send any genre from the XML. This product only stores Electronic releases in Mongo. Skipping non-Electronic rows at the command handler keeps the collection limited to releases whose dump genre list is exactly `['Electronic']`, without changing the API contract or the ingest script.

## What

`UpsertReleaseCommandHandler` calls `releaseRepository.upsertReleases` only when `command.genres` equals `['Electronic']` (single element, exact spelling). Otherwise it returns without writing. When it does upsert, it persists `command.genres` on the `ReleaseEntity`. Other dump fields (`country`, `released`, `styles`) are unchanged.

Done when:
- Handler unit tests prove upsert runs for `['Electronic']` and is skipped for other, missing, or multi-genre values.
- E2e proves a POST with `genres: ['Electronic']` persists the document; a POST with non-Electronic genres returns `204` and leaves Mongo unchanged.
- `npm run build && npm run test && npm run test:e2e` passes.

## Context

**Relevant files:**
- `src/release/application/upsert-release.command-handler.ts` — genre gate + build `ReleaseEntity`
- `src/release/application/upsert-release.command-handler.spec.ts` — handler unit tests (stub repository)
- `src/release/application/upsert-release.command.ts` — still accepts optional `genres` from controller (unchanged)
- `src/release/web/upsert-release.controller.ts` — maps DTO → command; no change required
- `src/release/web/upsert-release.dto.ts` — API still accepts `genres`; handler decides whether to write
- `test/release.e2e-spec.ts` — upsert happy-path + skip case for non-Electronic genres

**Patterns to follow:**
- `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc` — business rule in handler, not controller
- Handler unit tests with stubbed `ReleaseRepository` (`.cursor/rules/application-command.mdc`, `.cursor/rules/testing-unit.mdc`)
- E2e: focused assertions on Mongo presence/absence (`.cursor/rules/testing-e2e.mdc`)

**Key decisions:**
- Match exactly `['Electronic']` — not “includes Electronic” (e.g. `['Electronic', 'Techno']` is skipped, matching common single-genre dump rows)
- Apply gate in handler only — API still returns `204` when skipped (no error response; ingest can continue)
- Do not remove `genres` from DTO/command (script and clients keep sending dump values)
- Re-upsert semantics unchanged (spec 019): same `releaseId` with `genres: ['Electronic']` still updates via `$set`

## Constraints

**Must:**
- Early-return in handler when `command.genres` is not exactly `['Electronic']`
- Persist `command.genres` on the entity when upserting (will be `['Electronic']`)
- Update handler unit tests for upsert vs skip
- Add or adjust e2e: Electronic body persists; non-Electronic body does not create/update Mongo
- `npm run build && npm run test && npm run test:e2e` passes

**Must not:**
- Change `POST /release/batch`, Discogs client, or repository upsert logic
- Add dependencies
- Remove `genres` from API DTO or script POST body (out of scope)
- Return 4xx when genres are not Electronic (skip silently with `204`)
- Refactor unrelated code

**Out of scope:**
- Filtering dump rows in `scripts/read-discogs-releases.ts` before POST
- Removing `genres` from `UpsertReleaseCommand` or OpenAPI schema
- Unique index or query changes on `genres`

## Tasks

### T1: Upsert only when genres are exactly Electronic

**Do:**
1. In `upsert-release.command-handler.ts`, return early (no repository call) unless `command.genres` is exactly `['Electronic']`. When upserting, pass `genres: command.genres` into `ReleaseEntity.from`.
2. In `upsert-release.command-handler.spec.ts`:
   - Happy path: command with `['Electronic']`; expect `upsertReleases` called once with entity `genres` `['Electronic']`.
   - Skip: command with `['Rock']` (or similar); expect `upsertReleases` not called.
   - Skip: command with `genres` omitted; expect `upsertReleases` not called.
   - Skip: command with `['Electronic', 'Techno']`; expect `upsertReleases` not called.
3. In `test/release.e2e-spec.ts`:
   - Happy path: send `genres: ['Electronic']`; assert Mongo doc exists with `genres: ['Electronic']`.
   - Skip: send `genres: ['Rock', 'Folk, World, & Country']`; expect `204` and no document for that `releaseId`.

**Files:**
- `src/release/application/upsert-release.command-handler.ts`
- `src/release/application/upsert-release.command-handler.spec.ts`
- `test/release.e2e-spec.ts`

**Verify:**
```bash
npm run build && npm run test -- upsert-release.command-handler.spec && npm run test:e2e -- release.e2e-spec
```

## Done

- [ ] Handler upserts only when `command.genres` is exactly `['Electronic']`
- [ ] Unit + e2e tests cover upsert and skip paths
- [ ] `npm run build && npm run test && npm run test:e2e` passes
