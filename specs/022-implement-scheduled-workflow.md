# Scheduled release processing

## Why

Releases are stored in Mongo (via batch ingest and dump flows), but there is no automated path to refresh them from Discogs. Operators need to start a background job that periodically runs a use case so release data can be kept up to date without manual batch POSTs.

## What

Introduce a gated, interval-driven workflow:

- `POST /release/schedule-releases` — starts the scheduler (idempotent: safe to call again while already running)
- **Infrastructure scheduler** — fires once per minute; each tick dispatches `ProcessReleasesCommand` via `CommandBus` only while started
- **`ProcessReleasesCommand` + `ProcessReleasesCommandHandler`** — registered on the write side; handler is a **no-op** in this spec (orchestration of Mongo `releaseId`s → Discogs → upsert is a follow-up spec)

End-state intent (not implemented in tasks below): load `releaseId`s from Mongo, fetch each from Discogs (`RELEASE_DISCOGS_CLIENT`), upsert via `RELEASE_REPOSITORY` (same ports as `ProcessReleasesInBatchCommandHandler`).

## Context

**Relevant files:**
- `src/release/application/process-releases-in-batch.command-handler.ts` — future handler should mirror Discogs fetch + `upsertReleases` pattern
- `src/release/application/ports/release-repository.port.ts` — `upsertReleases`; will need a read method (e.g. `listReleaseIds`) in a later spec
- `src/release/application/ports/release-discogs-client.port.ts` — `RELEASE_DISCOGS_CLIENT`
- `src/release/web/process-releases-in-batch.controller.ts` — `ApiKeyGuard`, Swagger, `CommandBus`, `@HttpCode(204)` patterns for the new POST controller
- `src/release/application/release-application.module.ts` — register command handler
- `src/release/web/release-web.module.ts` — register new controller
- `src/app.module.ts` — register `ScheduleModule` globally
- `test/release.e2e-spec.ts` — extend with POST schedule cases

**Patterns to follow:**
- `.cursor/skills/implement-use-case-hexagonal/SKILL.mdc` — `Controller → CommandBus → Command → Handler`; scheduler is infrastructure, not business logic
- `.cursor/rules/api-layer.mdc` — one controller per operation; controller calls scheduler port/service, not Mongoose
- `.cursor/rules/application-command.mdc` — handler orchestrates ports only; no ORM in application
- Command handler unit tests: instantiate handler directly with stubs (see `process-releases-in-batch.command-handler.spec.ts`)
- Scheduler unit tests: instantiate scheduler with mocked `CommandBus`; call `tick()` directly (do not rely on real timers in unit tests)

**Key decisions:**
- Route: `POST /release/schedule-releases` (under existing `release` controller prefix and `ApiKeyGuard`)
- HTTP response: `204 No Content` on success
- Scheduler library: `@nestjs/schedule` with `@Interval(60_000)` (one tick per minute)
- Scheduler location: `src/release/infrastructure/schedule/` (infrastructure layer); it may inject `CommandBus` but must not inject repositories or Discogs client directly
- Gating: scheduler has `start(): void`; ticks no-op until `start()` was called from the endpoint
- `ProcessReleasesCommand` is an empty command class (no payload for now)
- `ProcessReleasesCommandHandler.execute` returns `void` and performs no work in this spec
- Do not change `POST /release/batch` or `ProcessReleasesInBatchCommandHandler`

## Constraints

**Must:**
- Add `@nestjs/schedule` dependency and `ScheduleModule.forRoot()` in `AppModule`
- Place scheduler class under `src/release/infrastructure/schedule/`
- Register `ProcessReleasesCommandHandler` in `ReleaseApplicationModule`
- Export scheduler from a small Nest module (e.g. `ReleaseScheduleModule`) imported by `ReleaseWebModule` / application wiring as needed
- Unit-test scheduler: not started → `tick()` does not call `CommandBus.execute`; after `start()` → `tick()` executes `ProcessReleasesCommand` once
- Unit-test command handler: `execute` resolves without throwing
- E2e: `POST /release/schedule-releases` → `401` without API key; `204` with valid key

**Must not:**
- Put scheduler in `src/release/application/` (infrastructure owns timing/transport of ticks)
- Import Mongoose into application/domain layers for this feature
- Implement Mongo read or Discogs fetch in `ProcessReleasesCommandHandler` (out of scope for T4)
- Refactor `ProcessReleasesInBatchCommandHandler` or batch POST controller

**Out of scope:**
- `listReleaseIds` / cursor pagination on `ReleaseRepository`
- Discogs fetch and upsert inside `ProcessReleasesCommandHandler`
- `POST` to stop the scheduler; concurrency limits beyond the `running` gate
- Cron expression configuration / env-based interval
- E2e assertion that Discogs or Mongo changed (handler is no-op)

## Tasks

### T1: `POST /release/schedule-releases` controller

**Do:**
1. Add `schedule-releases.controller.ts` under `src/release/web/`:
   - `@Controller('release')`, `@Post('schedule-releases')`, `@UseGuards(ApiKeyGuard)`
   - Inject the infrastructure scheduler (by class or a thin port token if you prefer — default: inject `ProcessReleasesScheduler` from infrastructure module)
   - Handler method calls `scheduler.start()` then returns
   - `@HttpCode(204)`, Swagger (`@ApiTags('release')`, `@ApiOperation`, `@ApiNoContentResponse`, `@ApiSecurity`, `@ApiUnauthorizedResponse`)
2. Register controller in `ReleaseWebModule`.
3. Wire `ReleaseScheduleModule` (or equivalent) into `ReleaseWebModule` imports so the controller can inject the scheduler.

**Files:**
- `src/release/web/schedule-releases.controller.ts`
- `src/release/web/release-web.module.ts`
- `src/release/infrastructure/schedule/release-schedule.module.ts` (minimal module exporting scheduler — can be stubbed until T2 if needed)

**Verify:** `npm run build`

### T2: Infrastructure task scheduler (1 minute interval)

**Do:**
1. `npm install @nestjs/schedule`.
2. Add `ScheduleModule.forRoot()` to `AppModule` imports.
3. Add `src/release/infrastructure/schedule/process-releases.scheduler.ts`:
   - `@Injectable()`, inject `CommandBus`
   - `private running = false`
   - `start(): void` sets `running = true`
   - `@Interval(60_000) async tick()` — if `!running`, return; else `await this.commandBus.execute(new ProcessReleasesCommand())`
4. Add `release-schedule.module.ts` — providers: `ProcessReleasesScheduler`; exports scheduler for web module.
5. Import `ReleaseScheduleModule` from `ReleaseApplicationModule` or `ReleaseWebModule` (scheduler must be instantiated once app-wide).
6. Add `process-releases.scheduler.spec.ts` — tests as in **Key decisions** (call `tick()` manually, no `jest.useFakeTimers` required).

**Files:**
- `package.json`, `package-lock.json`
- `src/app.module.ts`
- `src/release/infrastructure/schedule/process-releases.scheduler.ts`
- `src/release/infrastructure/schedule/process-releases.scheduler.spec.ts`
- `src/release/infrastructure/schedule/release-schedule.module.ts`
- `src/release/application/release-application.module.ts` and/or `src/release/web/release-web.module.ts`

**Verify:** `npm run build && npm run test -- process-releases.scheduler.spec`

### T3: Endpoint triggers the scheduler

**Do:**
1. Ensure T1 controller’s `start()` is invoked on every successful `POST /release/schedule-releases`.
2. Extend `test/release.e2e-spec.ts`:
   - `POST /release/schedule-releases` without `x-api-key` → `401`
   - With valid key → `204`
3. Optional unit test on controller: mock scheduler, assert `start()` called once per request (only if a controller spec file already exists in the feature; not required otherwise).

**Files:**
- `src/release/web/schedule-releases.controller.ts`
- `test/release.e2e-spec.ts`

**Verify:** `npm run build && npm run test:e2e -- release.e2e-spec`

### T4: `ProcessReleasesCommand` and no-op handler

**Do:**
1. Add `process-releases.command.ts` — empty class.
2. Add `process-releases.command-handler.ts`:
   - `@CommandHandler(ProcessReleasesCommand)`
   - `execute(_command: ProcessReleasesCommand): Promise<void>` — empty body, return `void`
3. Add `process-releases.command-handler.spec.ts` — `execute` resolves without throwing.
4. Register handler in `ReleaseApplicationModule` providers.
5. Ensure scheduler imports `ProcessReleasesCommand` from application (command DTO only — no handler import in infrastructure).

**Files:**
- `src/release/application/process-releases.command.ts`
- `src/release/application/process-releases.command-handler.ts`
- `src/release/application/process-releases.command-handler.spec.ts`
- `src/release/application/release-application.module.ts`

**Verify:** `npm run build && npm run test -- process-releases.command-handler.spec`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `POST /release/schedule-releases` with valid `x-api-key` returns `204`
- [ ] `POST /release/schedule-releases` without API key returns `401`
- [ ] Scheduler unit test: `tick()` does not execute command until `start()`; after `start()`, executes `ProcessReleasesCommand` once per `tick()`
- [ ] `ProcessReleasesCommandHandler` unit test passes (no-op)
- [ ] `POST /release/batch` and batch handler behavior unchanged (no regressions in existing release e2e cases)
