# discolux

NestJS API for Discogs integration. Architecture: DDD, CQRS, hexagonal (see `.cursor/rules/`).

## Development

```bash
npm install
npm run start:dev
```

Health: `GET http://localhost:3000/health`

## Docker

```bash
docker compose up --build
```

## Tests

```bash
npm run test:e2e
```
