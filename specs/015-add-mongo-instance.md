# Add Mongo instance

## Why

Release and future features need durable storage. Docker Compose already runs MongoDB, and `MONGO_URI` is documented, but the Nest app does not connect yet. Wiring Mongoose at the shared infrastructure layer establishes a single, config-driven connection before any repositories or schemas are added.

## What

Install Mongoose, register a global Mongo connection via `MONGO_URI`, import it from `AppModule`, and ensure unit/e2e tests and Docker Compose local runs can bootstrap without regressions. No collections, schemas, or persistence ports in this spec.

## Context

**Relevant files:**
- `docker-compose.yml` — `mongo` service on port 27017 with `mongo_data` volume (already present)
- `.env.example` — `MONGO_URI=mongodb://mongo:27017/change-me` (update db name to `discolux`)
- `src/app.module.ts` — root imports; `ConfigModule.forRoot({ isGlobal: true })` already registered
- `package.json` — `@nestjs/config` already a dependency; add `mongoose` + `@nestjs/mongoose`
- `src/shared/infrastructure/discogs/shared-discogs.module.ts` — pattern for shared infra modules
- `src/shared/infrastructure/discogs/discogs-http.client.ts` — `ConfigService.getOrThrow` usage
- `test/*.e2e-spec.ts` — import full `AppModule`; must not require a manually running Mongo container

**Patterns to follow:**
- Shared technical adapters live under `src/shared/infrastructure/<concern>/`
- Read secrets/URLs via `ConfigService.getOrThrow<string>('MONGO_URI')` (same as `DISCOGS_TOKEN`)
- Hexagonal rule (`.cursor/rules/infrastructure-persistence.mdc`): Mongoose schemas stay in infrastructure only; domain must not import Mongoose

**Key decisions:**
- Use `@nestjs/mongoose` + official `mongoose` (Nest 11–compatible versions from `npm install`)
- Connection URI from env var `MONGO_URI` only (no hard-coded hosts in code)
- Docker Compose hostname `mongo` for the `server` service; host machine dev uses `mongodb://127.0.0.1:27017/discolux`
- Database name: `discolux` (replace `change-me` placeholder in `.env.example`)
- E2e/unit bootstrap: use `mongodb-memory-server` (devDependency) so CI and local `npm run test:e2e` do not depend on `docker compose up`
- `@nestjs/config` is **already installed and global** — do not re-add or re-register it

## Constraints

**Must:**
- Add `SharedMongoModule` (or equivalent) under `src/shared/infrastructure/mongo/`
- Register Mongo module import in `AppModule` alongside existing modules
- Keep `ConfigModule` as-is (global, single `forRoot`)
- Set `process.env.MONGO_URI` (or equivalent) before `AppModule` loads in e2e tests
- Add `depends_on: mongo` to the `server` service in `docker-compose.yml`

**Must not:**
- Add Mongoose schemas, repositories, or release persistence
- Import Mongoose or infrastructure into `domain/` or application handlers
- Change existing HTTP API response shapes
- Require real Mongo for `npm run test` (unit tests)

**Out of scope:**
- Health check reporting Mongo status
- Mongo authentication / replica sets
- Release entity persistence (follow-up spec)
- Database migrations (`.cursor/rules/database-migrations.mdc` applies later)

## Tasks

### T1: Install Mongoose dependencies

**Do:**
1. `npm install @nestjs/mongoose mongoose`
2. `npm install -D mongodb-memory-server @types/mongodb-memory-server` (if types package exists; otherwise rely on package typings)
3. Update `.env.example`: `MONGO_URI=mongodb://mongo:27017/discolux` with a short comment that host dev uses `127.0.0.1`

**Files:** `package.json`, `package-lock.json`, `.env.example`

**Verify:** `npm run build`

### T2: Register Mongo connection module

**Do:**
1. Create `src/shared/infrastructure/mongo/shared-mongo.module.ts` exporting a module that calls `MongooseModule.forRootAsync` with `ConfigService.getOrThrow('MONGO_URI')`.
2. Import `SharedMongoModule` in `src/app.module.ts`.
3. Add `depends_on: [mongo]` to `server` in `docker-compose.yml`.
4. Add `test/mongo-memory.ts` (or `test/setup-mongo.ts`) that starts `MongoMemoryServer`, sets `process.env.MONGO_URI`, and exports `stopMongoMemory()` for teardown.
5. Wire e2e: in `test/jest-e2e.json`, add `setupFilesAfterEnv` (or `globalSetup` / `globalTeardown`) pointing at the mongo memory helper so all e2e specs get a URI before `AppModule` compiles. Alternatively call the helper from a shared `test/create-e2e-app.ts` if you prefer explicit imports — pick one approach and use it consistently in all four e2e files.
6. Ensure each e2e `beforeEach` that sets `process.env.API_KEY` runs **after** mongo memory URI is available (global setup runs first).

**Files:**
- `src/shared/infrastructure/mongo/shared-mongo.module.ts`
- `src/app.module.ts`
- `docker-compose.yml`
- `test/mongo-memory.ts` (name as implemented)
- `test/jest-e2e.json`
- `test/health.e2e-spec.ts`, `test/release.e2e-spec.ts`, `test/market.e2e-spec.ts`, `test/swagger.e2e-spec.ts` (only if not fully covered by jest global setup)

**Verify:** `npm run build && npm run test:e2e`

### T3: Smoke-verify Docker Compose stack

**Do:** Document in task verify only (no new files required): copy `.env.example` → `.env`, set real `API_KEY` / `DISCOGS_TOKEN`, run `docker compose up --build`, confirm server starts without Mongoose connection errors in logs.

**Verify:** Manual: `docker compose up --build` → server logs show Nest listening on 3000; `curl http://localhost:3000/health` returns `{"status":"ok"}`. Unhappy path: stop `mongo` container → server should log connection failure (expected until retry/restart policy is added later).

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes without Docker Mongo running
- [ ] `docker compose up` starts `server` after `mongo`; app connects using `MONGO_URI` from `.env`
- [ ] Manual: `GET /health` still returns `{ "status": "ok" }`
- [ ] No regressions in release/market e2e tests (Discogs stubs unchanged)
- [ ] No Mongoose schemas or domain imports of persistence code
