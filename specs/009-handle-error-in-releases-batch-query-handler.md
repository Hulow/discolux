# Handle Discogs errors in batch releases query handler

## Why

`GetReleasesInBatchQueryHandler` uses `Promise.all` over `discogsClient.getRelease`. When Discogs returns a non-2xx response (e.g. release not found), `DiscogsHttpClient` throws and the whole batch fails with a 500. Clients need a 200 response with per-ID outcomes so one missing release does not break the entire range.

## What

Change the batch query handler so each ID is fetched independently: successes return the Discogs release JSON as today; failures return a structured error object with `releaseId` and `errorMessage` (from the thrown `Error`). The HTTP endpoint still returns `200` when the range is valid, even if some IDs failed upstream.

## Context

**Relevant files:**
- `src/application/release/get-releases-in-batch.query-handler.ts` — replace `Promise.all` fail-fast with per-ID catch
- `src/application/release/get-releases-in-batch.query-handler.spec.ts` — stub that rejects for specific IDs
- `src/infrastructure/discogs/discogs-http.client.ts` — throws `Error` with message `Discogs API request failed: {status} {statusText}` on `!response.ok`
- `src/api/release/get-releases-in-batch.controller.ts` — Swagger `@ApiOkResponse` should describe mixed success/error items
- `test/release.e2e-spec.ts` — batch e2e cases; override `getRelease` to reject for one ID

**Patterns to follow:**
- Handler unit tests use a class stub implementing `DiscogsClient` (see `get-releases-in-batch.query-handler.spec.ts`)
- No `jest.fn()` in handler spec
- E2E overrides `DISCOGS_CLIENT` (see existing batch tests in `test/release.e2e-spec.ts`)

**Key decisions already made:**
- Handle errors in the **query handler** only — do not change `DiscogsHttpClient` or the port signature
- **Partial success:** other IDs in the range still return data when one fails
- Result array stays **ascending ID order** (index `0` = `from`, last = `till`)
- **HTTP 200** for valid range with mixed upstream failures; **400** only for invalid `from`/`till` (unchanged controller validation)
- Error item shape: `{ releaseId: string, errorMessage: string }` where `errorMessage` is `error.message` from the caught rejection (typically the Discogs client message)
- Success items remain **passthrough Discogs JSON** (`unknown`) with no wrapper — clients detect failures by presence of `errorMessage` on the object
- Update `GetReleasesInBatchResult` to reflect the union: `(unknown | BatchReleaseError)[]` with `BatchReleaseError` exported from the handler file (or a small types file next to it if preferred)

## Constraints

**Must:**
- Catch rejections per ID inside the handler; never let a single `getRelease` failure reject the whole `execute` promise
- Preserve ascending ID order and array length equal to range size (`till - from + 1`)
- Add handler unit test: one ID succeeds, one rejects — assert 200-equivalent result shape, order, and error fields
- Extend e2e: stub rejects for one ID in range; expect `200` and array containing both release objects and one error object

**Must not:**
- Change `DiscogsClient` port or `DiscogsHttpClient` in this task (except incidental if already modified elsewhere)
- Return 500 for upstream Discogs failures on an otherwise valid batch request
- Use `jest.fn()` in the handler unit test

**Out of scope:**
- Retrying failed Discogs calls
- Mapping HTTP status codes to application error types in the client
- Changing single-release `GET /release/:id` behavior
- Removing debug `console.log` in `discogs-http.client.ts`

## Tasks

### T1: Per-ID error handling in `GetReleasesInBatchQueryHandler`

**Do:** Define and export `BatchReleaseError` (`releaseId`, `errorMessage`) and update `GetReleasesInBatchResult`. Replace `Promise.all(ids.map(...))` with parallel fetches that `.catch` each rejection and return `{ releaseId, errorMessage: error.message }` (use `error instanceof Error ? error.message : String(error)`). Export types from the handler module. Update handler spec: stub `getRelease` resolves for `'1'`, rejects for `'2'`, resolves for `'3'`; assert length 3, order, success payloads, and error object for ID `2`. Update `@ApiOkResponse` schema in `GetReleasesInBatchController` to document array items as either release object or `{ releaseId, errorMessage }`. Add e2e: override `getRelease` to `Promise.reject(new Error('Discogs API request failed: 404 Not Found'))` when `releaseId === '2'`, else existing stub; `GET /release/batch?from=1&till=3` expects `200` with `[{ id: 1, ... }, { releaseId: '2', errorMessage: '...' }, { id: 3, ... }]`.

**Files:** `src/application/release/get-releases-in-batch.query-handler.ts`, `src/application/release/get-releases-in-batch.query-handler.spec.ts`, `src/api/release/get-releases-in-batch.controller.ts`, `test/release.e2e-spec.ts`

**Verify:** `npm run test && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release/batch?from=1&till=3` returns `200` when one ID fails upstream, with error object containing `releaseId` and `errorMessage` at the correct index
- [ ] All-success batch (`from=1&till=3`) unchanged for clients that only see release JSON
- [ ] Invalid range still returns `400`; no regressions on other release endpoints
