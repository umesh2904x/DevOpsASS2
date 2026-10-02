# Agile Planning - User Stories & Acceptance Criteria

## Epic: Bookstore Service

As a small bookstore owner I want a web service that manages books and orders,
so that I can serve customers without maintaining a manual spreadsheet.

---

## US-01: Health check endpoint

**As a** DevOps engineer
**I want** a `/api/health` endpoint
**So that** Docker, Kubernetes and CI can verify the service is alive.

**Acceptance criteria**
1. `GET /api/health` returns HTTP 200.
2. Response contains `status`, `version`, `commit`, `uptimeSeconds`.
3. Response time under 50 ms.

**Story points:** 2  **Priority:** High  **Sprint:** 1

---

## US-02: List and browse books

**As a** shop assistant
**I want** to list all books and fetch one by id
**So that** I can answer customer enquiries.

**Acceptance criteria**
1. `GET /api/books` returns `{count, books[]}`.
2. `GET /api/books/:id` returns the book.
3. Unknown id returns HTTP 404 with an `error` field.

**Story points:** 3  **Priority:** High  **Sprint:** 1

---

## US-03: Add a new book

**As a** shop owner
**I want** to add a book through the API
**So that** new arrivals appear in the catalogue.

**Acceptance criteria**
1. `POST /api/books` with `title` and `price` returns HTTP 201.
2. Missing `title` or non-numeric `price` returns HTTP 400.
3. The new book appears in `GET /api/books`.

**Story points:** 3  **Priority:** High  **Sprint:** 1

---

## US-04: Place an order

**As a** customer
**I want** to place an order for one or more books
**So that** I can buy books online.

**Acceptance criteria**
1. `POST /api/orders` with `items: [{bookId, qty}]` returns HTTP 201 and a total.
2. Empty or missing `items` returns HTTP 400.
3. Unknown `bookId` returns HTTP 404.
4. Requesting more than available stock returns HTTP 409.
5. Stock is reduced after a successful order.

**Story points:** 5  **Priority:** High  **Sprint:** 1

---

## US-05: Prometheus metrics

**As a** site reliability engineer
**I want** the service to expose `/metrics` in Prometheus format
**So that** I can build dashboards and alerts.

**Acceptance criteria**
1. `GET /metrics` returns HTTP 200 with `text/plain` content type.
2. Exposes `bookstore_up`, `bookstore_requests_total`,
   `bookstore_orders_created_total`, `bookstore_errors_5xx_total`,
   `bookstore_request_latency_ms`, `bookstore_build_info`.
3. All counters only increase.

**Story points:** 3  **Priority:** High  **Sprint:** 1

---

## US-06: Grafana dashboard

**As a** team lead
**I want** a Grafana dashboard for the bookstore
**So that** health is visible without running queries.

**Acceptance criteria**
1. Dashboard `Bookstore - DevOps Monitoring` is auto-provisioned on Grafana start.
2. Shows service status, request rate, orders created, 5xx errors and latency.
3. Refreshes every 10 seconds over a 30 minute window.

**Story points:** 3  **Priority:** Medium  **Sprint:** 1

---

## US-07: Alerting

**As a** on-call engineer
**I want** an alert when the service goes down or errors spike
**So that** I am notified before customers complain.

**Acceptance criteria**
1. `BookstoreDown` fires when `bookstore_up == 0` for 1 minute.
2. `HighErrorRate` fires when 5xx rate exceeds 0.5/s for 2 minutes.
3. Alerts route to Alertmanager and are visible in Prometheus `/alerts`.

**Story points:** 2  **Priority:** Medium  **Sprint:** 1

---

## US-08: Automated CI pipeline

**As a** developer
**I want** every push to be linted, tested and built automatically
**So that** broken code never reaches main.

**Acceptance criteria**
1. `ci.yml` runs lint, unit tests with coverage and build on push and PR.
2. The job fails if any test fails.
3. Docker image is built after the quality gate passes.
4. Build artifact is uploaded from `dist/`.

**Story points:** 5  **Priority:** High  **Sprint:** 1

---

## US-09: Automated CD pipeline

**As a** release manager
**I want** tagging a version to deploy automatically
**So that** releases are repeatable and safe.

**Acceptance criteria**
1. `cd.yml` triggers on `v*` tags.
2. Image is pushed to GHCR with the version tag.
3. `docker compose up -d --build` starts the full stack.
4. Smoke tests run against `/api/health`, `/metrics` and monitoring endpoints.
5. A deployment summary is written to the GitHub Actions job summary.

**Story points:** 5  **Priority:** High  **Sprint:** 1

---

## Definition of Done (DoD)

A story is **Done** when:

- [x] Code is merged into `develop` through an approved pull request
- [x] `npm run lint` passes with zero findings
- [x] Unit tests pass and coverage is reported
- [x] Application builds successfully
- [x] Docker image builds without error
- [x] Feature is observable through metrics
- [x] Documentation updated

## Kanban Board Snapshot

| Backlog | Ready for Dev | In Progress | Code Review | Testing | Done |
|---------|---------------|-------------|-------------|---------|------|
| US-08 | US-05 | US-04 | US-02 | US-07 | US-01 |
| US-09 | US-03 | | | | US-06 |

## Sprint Ceremonies

| Ceremony | When | Purpose |
|----------|------|---------|
| Sprint Planning | Monday 10:00 | Select stories from backlog for the sprint |
| Daily Stand-up | Daily 09:30 | Progress, blockers, plan |
| Sprint Review | Friday 15:00 | Demonstrate Done stories to stakeholder |
| Retrospective | Friday 16:00 | Improve the process itself |
