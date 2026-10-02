# Screenshot Checklist - What To Capture For Each Question

Total: about **26 screenshots**. Number them `Q1-01.png`, `Q2-05.png` etc and put
them in an `evidence/screenshots/` folder.

---

## Q1 - CI/CD Pipeline (9 screenshots)

| # | What to screenshot | How to get it |
|---|-------------------|---------------|
| Q1-01 | Local build + tests passing | `cd q1-ci-cd-pipeline` then `npm run verify` - terminal window showing `pass 8 / fail 0` |
| Q1-02 | GitHub repo Actions tab, `ci.yml` run list | Push code, open repo > **Actions** tab |
| Q1-03 | Expanded CI run showing each step green | Click the latest run > click `build-test` job > expand **Lint**, **Unit tests**, **Build artifact** |
| Q1-04 | PR with green "All checks passed" | Create branch, push, open PR |
| Q1-05 | `docker build` output | `docker build -t task-api:1.0.0 .` |
| Q1-06 | `docker compose up` output + `docker compose ps` | `docker compose up -d --build` then `docker compose ps` |
| Q1-07 | API working | Browser: `http://localhost:3000/api/health` and `http://localhost:3000/api/tasks` |
| Q1-08 | CD workflow run after tagging | `git tag v1.0.0 && git push --tags` then Actions > `CD - Deploy` run |
| Q1-09 | Prometheus targets UP + Grafana dashboard | `http://localhost:9090/targets` and `http://localhost:3001` (login `admin` / `admin123`) |

---

## Q2 - MLflow + Prometheus/Grafana (9 screenshots)

| # | What to screenshot | How to get it |
|---|-------------------|---------------|
| Q2-01 | Terminal output of `train.py` - 6 runs with f1 scores | Run `python train.py` in `q2-mlflow-mlops` |
| Q2-02 | MLflow UI experiment list | `http://localhost:5000` > **Experiments** > `breast-cancer-classifier` |
| Q2-03 | MLflow run comparison table | Click experiment > tick all 6 runs > **Compare** |
| Q2-04 | One run's **Parameters** tab | Click any run > **Parameters** |
| Q2-05 | One run's **Metrics** tab | Click any run > **Metrics** (accuracy, precision, recall, f1, roc_auc) |
| Q2-06 | Model Registry with version + alias | MLflow sidebar > **Models** > `cancer-detector` |
| Q2-07 | Model serving `/health` + `/predict` response | `curl http://localhost:8000/health` then a POST to `/predict` |
| Q2-08 | `/metrics` output from the model API | Browser: `http://localhost:8000/metrics` |
| Q2-09 | Prometheus target UP + Grafana MLOps dashboard with graphs | `http://localhost:9090/targets`, `http://localhost:3001` > dashboard `ML Model API - Monitoring` |

> Run `python load_test.py --requests 200` between Q2-07 and Q2-08 so the graphs
> have data.

---

## Q3 - End-to-End DevOps (8 screenshots)

| # | What to screenshot | How to get it |
|---|-------------------|---------------|
| Q3-01 | Git branch strategy | `git branch -a` in terminal, or GitHub branches page |
| Q3-02 | PR with review + green checks | GitHub > **Pull requests** > open PR |
| Q3-03 | Full CI run green for all 3 jobs | Actions > `CI - Continuous Integration` run, expand all jobs |
| Q3-04 | CD deployment summary table | Actions > `CD - Continuous Deployment` run > **Deployment Report** step |
| Q3-05 | Architecture diagram | Render `docs/ARCHITECTURE.md` (GitHub renders Mermaid automatically) |
| Q3-06 | `docker compose ps` - all 5 services up | `docker compose ps` |
| Q3-07 | Prometheus alerts page + firing/pending rules | `http://localhost:9090/alerts` |
| Q3-08 | Grafana `Bookstore - DevOps Monitoring` dashboard | `http://localhost:3001` (login `admin` / `admin123`) |

---

## Pro Tips

1. **Full-screen the terminal** before running commands so text is readable.
2. Maximise the browser (`F11`) for dashboard screenshots.
3. Make sure the terminal shows the **command** and the **output** together.
4. Name files in order so your report reads cleanly.
5. For the architecture diagram, push `docs/ARCHITECTURE.md` and screenshot the
   rendered version directly from GitHub - no extra tooling needed.

---

## Important Note About Running On Your Machine

Two things are installed/needed locally:

- **Python 3.12** - already installed, and a virtual environment exists at
  `DevOpsASS2/.venv` with MLflow, scikit-learn, Flask and prometheus-client.
- **Docker Desktop** - not installed yet. Install it before running the Docker
  steps. Everything Docker-related also runs in GitHub Actions, so if Docker is
  a problem you can take those screenshots from the Actions logs instead.

If a Python import fails with
`ImportError: DLL load failed ... An Application Control policy has blocked this file`,
your college laptop has a Windows Application Control (WDAC) policy blocking
compiled Python packages. Use either Docker (`docker compose up trainer`) or let
GitHub Actions run it on `ubuntu-latest` - both are unaffected by that policy.
