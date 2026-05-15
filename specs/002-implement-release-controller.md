# Implement a release endpoint

## Why

I will need in the future an endpoint to get the release id from discogs api.

## Instructions

Create `specs/<feature-slug>.md`:

Follow the skill Implement use case hexagonal

## Tasks

### T1: Implement a get release controller with this endpoint: get /release/id

### T2: Add a simple static API key to be able to send a get request from outside

### T3: Implement a getReleaseCommandHandler and implement a getReleaseCommand for the releaseId

### T4: Add NestJS Config to read the API key

**Do:** Register `@nestjs/config` (`ConfigModule.forRoot({ isGlobal: true })`) and inject `ConfigService` in `ApiKeyGuard` instead of reading `process.env.API_KEY` directly.

**Files:** `package.json`, `src/app.module.ts`, `src/api/release/guards/api-key.guard.ts`

**Verify:** `npm run build && npm run test:e2e`

## Done

- [ ] `npm run build && npm run test && npm run test:e2e` passes
- [ ] `GET /release/:id` with `x-api-key` header returns `{ releaseId }`
