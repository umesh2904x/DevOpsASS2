# Q1 Screenshots - Complete Step-by-Step Guide

9 screenshots for Q1 (CI/CD Pipeline). Everything below is already set up and
verified - follow it in order.

**Status:** CI pipeline is **green** on GitHub (run #3). The CD pipeline is
triggered by the `v1.0.0` tag and runs the whole Docker Compose stack.

---

## Where each screenshot comes from

| # | Screenshot | Source | Status |
|---|-----------|--------|--------|
| Q1-01 | Build + tests passing locally | Your terminal | Ready now |
| Q1-02 | Actions tab, CI run list | GitHub | Ready now |
| Q1-03 | Expanded CI run, all steps green | GitHub | Ready now |
| Q1-04 | PR with "All checks passed" | GitHub | Ready now |
| Q1-05 | Docker build output | GitHub CD log **or** local Docker | Running |
| Q1-06 | `docker compose ps` all services up | GitHub CD log **or** local Docker | Running |
| Q1-07 | API working in browser | Local (no Docker needed) | Ready now |
| Q1-08 | CD run + deployment summary | GitHub | Running |
| Q1-09 | Prometheus targets + Grafana dashboard | Auto-captured PNG in CD artifact | Running |

> **You do not need Docker Desktop installed for Q1.** The CD workflow runs on
> GitHub's Ubuntu runner where Docker already exists, and it saves
> `grafana-dashboard.png` and `prometheus-targets.png` as a downloadable
> artifact. If you install Docker locally you can take nicer screenshots
> instead - both work.

---

## Step-by-step

### Q1-01 - Local build and tests

Open Command Prompt, maximise the window, then:

```bat
cd C:\Users\Umesh\DevOpsASS2\q1-ci-cd-pipeline
capture-q1.cmd local
```

Screenshot the terminal showing:

```
> task-api@1.0.0 verify
> npm run lint && npm test && npm run build

Lint passed: no issues found

✔ GET /api/health returns UP
✔ GET /api/tasks returns seeded tasks
✔ POST /api/tasks creates a task
✔ POST /api/tasks without title returns 400
✔ PUT /api/tasks/:id updates done flag
✔ PUT unknown task returns 404
✔ DELETE /api/tasks/:id removes a task
✔ unknown route returns 404 json
✔ GET /metrics exposes prometheus text format
✔ metrics counters increase after a write

ℹ tests 10
ℹ pass 10
ℹ fail 0
```

Then press any key - it starts the API. Move to **Q1-07**.

---

### Q1-07 - API working (do this right after Q1-01)

Wait 5 seconds, open Chrome, and screenshot each of these:

| URL | What the screenshot shows |
|-----|--------------------------|
| `http://localhost:3000/api/health` | `{"status":"UP","uptimeSeconds":...,"version":"1.0.0"}` |
| `http://localhost:3000/api/tasks` | the two seeded tasks in JSON |
| `http://localhost:3000/metrics` | Prometheus text format - proves monitoring works |

Then close the API window.

---

### Q1-02 - GitHub Actions run list

Open: `https://github.com/umesh2904x/DevOpsASS2/actions`

Screenshot the Actions tab showing the workflow runs. You should see
**Q1 CI - Build and Test** with a **green tick** (run #3), plus the earlier red
runs - keep those visible, they prove the pipeline actually gates the build.

---

### Q1-03 - Expanded CI run, every step green

Click the green **Q1 CI - Build and Test** run -> click the **Lint, Test and
Build** job -> expand these steps and screenshot:

- **Lint**
- **Unit tests with coverage** (shows the test table and coverage %)
- **Build artifact**
- **Upload build artifact**

Then scroll down and screenshot the **Build Docker Image** job also green.

---

### Q1-04 - Pull Request with green checks

In the terminal:

```bat
cd C:\Users\Umesh\DevOpsASS2
git checkout -b feature/q1-metrics-endpoint
```

Make a small real change - for example append a task to the seed list in
`q1-ci-cd-pipeline/server/src/app.js`:

```js
{ id: 3, title: 'Wire up monitoring', done: false }
```

...and change `nextId` from `3` to `4`. Then:

```bat
git add .
git commit -m "feat(US-05): add metrics endpoint test and seed task"
git push -u origin feature/q1-metrics-endpoint
```

Open GitHub -> it shows "Compare & pull request". Click it, write
`Adds the metrics endpoint work for US-05`, and create the PR.

Screenshot the PR page showing:

- the **Checks** tab with `Q1 CI - Build and Test` passing
- the Files changed tab

Wait for it to pass, screenshot again, then close the PR (do not merge - the tag
already exists).

---

### Q1-05 and Q1-06 - Docker build and Compose (from the CD run)

Open the Actions tab -> click **Q1 CD - Deploy**. Screenshot these steps:

| Step | Use it for |
|------|-----------|
| **Build and push image to GHCR** | Q1-05 - shows the whole Docker build |
| **Deploy using Docker Compose** | Q1-06 - shows `docker compose up` and the `docker compose ps` table with all 3 services |
| **Container logs** | bonus - shows the app starting up |

In the `docker compose ps` output you should see `task-api`, `task-api-prometheus`
and `task-api-grafana` all listed as `Up` / `running`.

---

### Q1-08 - CD run and deployment summary

Same **Q1 CD - Deploy** run, scroll to the bottom, click the
**Deployment summary** step. Screenshot the markdown table it wrote:

```
### Q1 Deployment Successful

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Image | ghcr.io/umesh2904x/DevOpsASS2:1.0.0 |
| Commit | ... |
| Deployed by | umesh2904x |
```

Screenshot the whole Actions page too, with the green tick next to
**Q1 CD - Deploy**.

---

### Q1-09 - Prometheus and Grafana

**Option A - download the auto-captured PNGs (no Docker needed):**

In the **Q1 CD - Deploy** run, scroll to the bottom and click
**Artifacts** -> download `q1-deployment-evidence`. Extract it. You get:

```
evidence/grafana-dashboard.png     <- Q1-09
evidence/prometheus-targets.png    <- Q1-09
evidence/compose-ps.txt
evidence/container-logs.txt
evidence/metrics.txt
```

Open the two PNGs and screenshot them.

**Option B - live in your browser (nicer, needs Docker Desktop):**

```bat
cd C:\Users\Umesh\DevOpsASS2\q1-ci-cd-pipeline
capture-q1.cmd docker
```

The script builds the image, starts the stack, waits, and generates traffic.
Then screenshot:

| URL | Login | Shows |
|-----|-------|-------|
| `http://localhost:9090/targets` | - | `task-api` target with health **UP** |
| `http://localhost:3001` | `admin` / `admin123` | folder **Task API** -> dashboard **Task API - Monitoring** |

The dashboard should show Service Status **UP**, non-zero Total Requests,
and graphs for request rate, task operations and latency.

To clean up afterwards:

```bat
docker compose down
```

---

## Final checklist before submission

- [ ] Q1-01 local verify showing `pass 10 / fail 0`
- [ ] Q1-02 Actions tab with runs listed
- [ ] Q1-03 CI job expanded, every step green
- [ ] Q1-04 PR page with green checks
- [ ] Q1-05 Docker build steps in the CD log
- [ ] Q1-06 `docker compose ps` with 3 services Up
- [ ] Q1-07 `/api/health`, `/api/tasks`, `/metrics` in the browser
- [ ] Q1-08 CD run green + deployment summary table
- [ ] Q1-09 Prometheus targets UP + Grafana dashboard

## Troubleshooting

**`Docker is not installed or not in PATH`** - expected, Docker Desktop is not
installed yet. Use Option A for Q1-09, or install Docker Desktop.

**Port already in use** - only one stack at a time:
`docker compose down` in whichever project you started last.

**CI shows red again after I edit code** - that is the pipeline working
correctly. Fix the code, or the tests, then push again.
