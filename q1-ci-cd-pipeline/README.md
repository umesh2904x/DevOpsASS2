# Q1 - CI/CD Pipeline (GitHub Actions + Docker + Docker Compose)

A small Task Manager REST API built and deployed through a full CI/CD pipeline.

## What This Shows

- **Automated build** - `npm run build` produces `dist/build-info.json`
- **Automated testing** - 8 unit tests with coverage, plus a lint gate
- **Containerization** - multi-stage `Dockerfile`
- **Deployment** - `docker-compose.yml` runs the API with Prometheus + Grafana

## Project Layout

```
q1-ci-cd-pipeline/
├── server/
│   ├── src/app.js          Express app (in-memory store)
│   ├── src/server.js       HTTP server with graceful shutdown
│   └── tests/api.test.js   8 tests using node:test + supertest
├── scripts/
│   ├── lint.js             custom lint (trailing whitespace, var, debugger, tabs)
│   └── build.js            writes dist/build-info.json
├── monitoring/
│   ├── prometheus.yml      scrape config (api:3000/metrics every 15s)
│   └── grafana/            provisioning
├── .github/workflows/
│   ├── ci.yml              lint -> test -> build -> docker build
│   └── cd.yml              tag v* -> push image -> compose deploy -> smoke test
├── Dockerfile              multi-stage: build then slim runtime, non-root user
└── docker-compose.yml      api + prometheus + grafana
```

## Run Locally

```bash
npm install
npm run verify          # lint + tests + build
npm start               # http://localhost:3000
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness, used by Docker healthcheck and CI smoke test |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task (requires `title`) |
| PUT | `/api/tasks/:id` | Update `title` / `done` |
| DELETE | `/api/tasks/:id` | Delete task |

## Run With Docker

```bash
docker build -t task-api:1.0.0 .
docker compose up -d --build
docker compose ps
curl http://localhost:3000/api/health
```

## The Pipeline

### Continuous Integration (`ci.yml`)

Runs on every push to `main`/`develop` and on every pull request.

1. Checkout code
2. Setup Node.js 20 with npm cache
3. `npm ci`
4. `npm run lint`
5. `npm run coverage` (c8 coverage report)
6. `npm run build` -> uploads `dist/` as an artifact
7. Separate job builds the Docker image with Buildx and GHA layer cache

Any failing step fails the job, which blocks the PR.

### Continuous Deployment (`cd.yml`)

Runs when a `v*` tag is pushed, or manually via `workflow_dispatch`.

1. Reads the version from the git tag
2. Logs in to GHCR using `GITHUB_TOKEN`
3. Builds and pushes `ghcr.io/<repo>:<version>` and `:latest`
4. `docker compose up -d --build`
5. Smoke tests `/api/health`
6. Writes a deployment summary to the Actions job summary

### Triggering a Release

```bash
git tag v1.0.0
git push --tags
```

## Screenshots Needed

See `../docs/SCREENSHOTS.md` (Q1-01 to Q1-09).
