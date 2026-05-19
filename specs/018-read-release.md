# Read releases from Discogs XML dump (standalone script)

## Why

The monthly dump (`data/discogs_20260501_releases.xml`, ~57 GB) is too large to load into memory and is not part of the NestJS app. A **standalone script** lets you stream releases locally (inspect, pipe, or build one-off pipelines) without touching application layers, Mongo, or HTTP.

## What

Add a CLI script under `scripts/` that **streams** `<release>` elements from the XML file and writes **one JSON object per line** (NDJSON) to stdout.

```bash
npm run read-releases -- --file data/discogs_20260501_releases.xml --limit 10
```

Each line is a plain object, e.g. `{ "id": 1, "title": "...", "country": "...", "released": "...", "genres": [...], "styles": [...] }`.

Default `--file`: `data/discogs_20260501_releases.xml` (relative to `process.cwd()`).

## Context

**Relevant files:**
- `data/discogs_20260501_releases.xml` — `<releases>` root, repeated `<release id="N">…</release>` (gitignored under `data/`)
- `package.json` — add `read-releases` npm script and `sax` dependency

**XML shape (per release):** `id` attribute; extract `title`, `country`, `released`, `genres/genre[]`, `styles/style[]`. Ignore artists, tracklist, videos, etc.

**Patterns to follow:**
- Self-contained under `scripts/`; **no imports from `src/`**
- Node built-ins (`fs`, `readline` not needed) + `sax` only for XML
- `fs.createReadStream` + SAX; buffer one `<release>…</release>` subtree; parse subtree synchronously (KB per release)

**Key decisions:**
- Entry: `scripts/read-discogs-releases.ts` (shebang optional)
- Shared logic: `scripts/lib/stream-releases.ts` (async generator), `scripts/lib/parse-release-xml.ts` (subtree string → object)
- **Streaming:** constant memory w.r.t. file size (one release buffer + stdout backpressure)
- **Output:** NDJSON on stdout; progress/errors on stderr (`console.error`)
- **CLI flags:** `--file <path>`, `--limit <n>` (optional, positive integer)
- **Errors:** missing file → exit 1; bad `--limit` → exit 1; malformed release → log to stderr, skip, continue
- Run via `ts-node` with `scripts/tsconfig.json` (extends root, no Nest decorators/paths required)
- Tests live next to lib code (`scripts/lib/*.spec.ts`); Jest `rootDir` stays `src` today — add a second Jest project or run script tests with `jest --roots scripts` / include `scripts` in `testRegex` — simplest: put specs in `scripts/lib/*.spec.ts` and verify with `npm run test -- stream-releases.spec` after extending Jest `roots` or `testMatch` to include `scripts/**/*.spec.ts`

## Constraints

**Must:**
- Live entirely under `scripts/` (+ `test/fixtures/releases-sample.xml` for tests)
- Stream the file; never read the whole dump into memory
- Zero imports from `src/` (no domain, application, infrastructure, Nest)
- Unit-test parser + stream against a small inline XML string or `test/fixtures/releases-sample.xml`
- Add npm script `read-releases` in `package.json`

**Must not:**
- Add controllers, command handlers, ports, or modules under `src/release/`
- Call Mongo, Discogs client, or `ReleaseRepository`
- Change `.env.example`, `app.module.ts`, or release e2e tests
- Commit or load the 57 GB file in CI

**Out of scope:**
- Writing to Mongo or calling the API
- Resumable offset / checkpoint into the dump
- Importing script code from the Nest app (future bridge is a separate spec)

## Tasks

### T1: Streaming parser library

**Do:**
1. Add `scripts/tsconfig.json` — extends root `tsconfig.json`, `"include": ["./**/*"]`, no path aliases to `src/`.
2. Add `scripts/lib/parse-release-xml.ts` — parse a single `<release>…</release>` XML string to `{ id, title?, country?, released?, genres?, styles? }`; normalize `genre`/`style` to `string[]` when one or many.
3. Add `scripts/lib/stream-releases.ts` — `async function* streamReleases(filePath: string): AsyncGenerator<ParsedRelease>` using `createReadStream` + `sax`; yield parsed objects per closed `</release>`.
4. Add `scripts/lib/parse-release-xml.spec.ts` and `scripts/lib/stream-releases.spec.ts` — use a minimal 2-release XML snippet; assert fields and order.
5. Add `test/fixtures/releases-sample.xml` (2–3 minimal releases) for stream test.
6. Extend Jest config in `package.json` so `scripts/**/*.spec.ts` runs (e.g. `"roots": ["<rootDir>", "../scripts"]` or `"testMatch": ["**/*.spec.ts"]` with adjusted `rootDir` — pick the smallest change that runs both `src` and `scripts` specs).
7. Add `sax` (+ `@types/sax` if needed) to `package.json`.

**Files:**
- `scripts/tsconfig.json`
- `scripts/lib/parse-release-xml.ts`
- `scripts/lib/stream-releases.ts`
- `scripts/lib/parse-release-xml.spec.ts`
- `scripts/lib/stream-releases.spec.ts`
- `test/fixtures/releases-sample.xml`
- `package.json`

**Verify:** `npm run test -- stream-releases.spec parse-release-xml.spec`

### T2: CLI entrypoint

**Do:**
1. Add `scripts/read-discogs-releases.ts` — parse `--file` / `--limit` from `process.argv` (manual parse or `node:util` `parseArgs`); default file path as above; iterate `streamReleases`; `console.log(JSON.stringify(release))` per release; stop after `limit`; `process.exit(1)` on fatal errors.
2. Add npm script: `"read-releases": "ts-node --project scripts/tsconfig.json scripts/read-discogs-releases.ts"`.
3. Add `ts-node` to devDependencies if not already present.

**Files:**
- `scripts/read-discogs-releases.ts`
- `package.json`

**Verify:**
- `npm run read-releases -- --file test/fixtures/releases-sample.xml --limit 2` prints 2 JSON lines with expected `id` values
- `npm run build && npm run test` still passes (no `src/` changes)

## Done

- [ ] `npm run test` passes (including new `scripts/lib` specs)
- [ ] `npm run read-releases -- --file test/fixtures/releases-sample.xml --limit 3` prints 3 NDJSON lines on stdout
- [ ] No new files under `src/release/infrastructure/` or other app layers
- [ ] `npm run build` unchanged (Nest build does not need to compile `scripts/` unless you opt in later)
