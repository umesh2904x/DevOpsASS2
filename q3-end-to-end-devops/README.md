# Q3 - End-to-End DevOps Pipeline

One application, the complete workflow: **Agile planning -> Git -> CI -> CD ->
deployment -> monitoring -> feedback into backlog**.

## The Six Stages

| Stage | Tool | Artefact |
|-------|------|----------|
| 1. Agile planning | User stories, sprint backlog, kanban | `docs/AGILE_PLANNING.md` |
| 2. Version control | Git flow (main / develop / feature) | `docs/GIT_WORKFLOW.md` |
| 3. CI | GitHub Actions `q3-ci.yml` | lint + tests + build + image |
| 4. CD | GitHub Actions `q3-cd.yml` | tagged release -> compose deploy |
| 5. Deployment | Docker Compose | 5 services running |
| 6. Monitoring | Prometheus + Grafana + Alertmanager | dashboards + alerts |

Architecture diagrams: `../docs/ARCHITECTURE.md`.

> Workflow files live at the repository root in `.github/workflows/` as
> `q3-ci.yml`, `q3-cd.yml` and `q3-nightly.yml`, because GitHub Actions only
> discovers workflows in the root `.github/workflows/` directory.

## Project Layout

```
q3-end-to-end-devops/
├── server/
│   ├── src/app.js           Express API + hand-rolled Prometheus metrics
│   ├── src/server.js        HTTP server
│   └── tests/api.test.js    12 tests
├── scripts/                 lint.js, build.js
├── docs/
│   ├── AGILE_PLANNING.md    9 user stories, DoD, kanban, ceremonies
│   └── GIT_WORKFLOW.md      branching strategy
├── monitoring/
│   ├── prometheus.yml       scrape config + alertmanager wiring
│   ├── alerts.yml           BookstoreDown, HighErrorRate, SlowRequests
│   ├── alertmanager.yml
│   └── grafana/             datasource + auto-provisioned dashboard
├── Dockerfile               build stage runs tests, runtime stage is non-root
└── docker-compose.yml       bookstore, postgres, prometheus, grafana, alertmanager
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness + build metadata (version, commit, build number) |
| GET | `/metrics` | Prometheus exposition format |
| GET | `/api/books` | List catalogue |
| GET | `/api/books/:id` | One book |
| POST | `/api/books` | Add book (`title`, `price` required) |
| POST | `/api/orders` | Place order, validates stock, returns 409 if insufficient |
| GET | `/api/orders` | Recent orders |

## Run Locally

```bash
npm install
npm run verify      # lint + 12 tests + coverage + build
npm start           # http://localhost:3000
```

Coverage from the last local run: **100% statements, 87.5% branches**.

## Run With Docker

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:3000/api/health
curl http://localhost:3000/metrics
```

| Service | URL |
|---------|-----|
| bookstore | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (`admin` / `admin123`) |
| Alertmanager | http://localhost:9093 |

Generate some traffic so the dashboards are not empty:

```bash
for i in $(seq 1 50); do
  curl -s -X POST http://localhost:3000/api/books \
    -H 'Content-Type: application/json' -d "{\"title\":\"Book $i\",\"price\":299}" > /dev/null
  curl -s -X POST http://localhost:3000/api/orders \
    -H 'Content-Type: application/json' -d '{"items":[{"bookId":1,"qty":1}]}' > /dev/null
done
```

Then open Grafana > folder **Bookstore** > dashboard **Bookstore - DevOps Monitoring**.

## Monitoring

### Metrics exposed by the app

| Metric | Type |
|--------|------|
| `bookstore_up` | gauge (always 1 while alive) |
| `bookstore_requests_total` | counter |
| `bookstore_books_added_total` | counter |
| `bookstore_orders_created_total` | counter |
| `bookstore_errors_5xx_total` | counter |
| `bookstore_request_latency_ms` | gauge |
| `bookstore_build_info{version,commit}` | gauge |

### Alerts (`monitoring/alerts.yml`)

| Alert | Condition | Severity |
|-------|-----------|----------|
| `BookstoreDown` | `bookstore_up == 0` for 1m | critical |
| `HighErrorRate` | 5xx rate > 0.5/s for 2m | warning |
| `SlowRequests` | latency > 500ms for 2m | warning |

View them at http://localhost:9090/alerts.

### The feedback loop

Monitoring is not the end of the pipeline - it feeds the Agile backlog:

```
Grafana shows HighErrorRate
  -> on-call opens an issue linked to a user story
  -> story added to docs/AGILE_PLANNING.md backlog
  -> feature branch created
  -> PR -> ci.yml -> review -> merge
  -> tag v1.0.1 -> cd.yml -> deployed
  -> Grafana confirms the error rate dropped
```

That closed loop is what makes this end-to-end rather than three separate tools.

## Screenshots Needed

See `../docs/SCREENSHOTS.md` (Q3-01 to Q3-08).
