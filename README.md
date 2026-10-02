# DevOpsASS2 - Assignment 2

All three questions in one repository.

| Folder | Question | Covers |
|--------|----------|--------|
| `q1-ci-cd-pipeline/` | **Q1** | GitHub Actions CI/CD, Docker, Docker Compose |
| `q2-mlflow-mlops/` | **Q2** | MLflow tracking, Model Registry, deployment, Prometheus + Grafana |
| `q3-end-to-end-devops/` | **Q3** | Agile + Git + CI/CD + deployment + monitoring, end to end |

## Verified Locally

```
q1-ci-cd-pipeline      lint PASS | tests 8/8 PASS | build OK
q3-end-to-end-devops   lint PASS | tests 12/12 PASS | coverage 100% stmts | build OK
```

Logs are saved in `evidence/`.

## Architecture Diagram

`docs/ARCHITECTURE.md` - Mermaid diagrams for all three questions. GitHub renders
them automatically.

## Screenshots

`docs/SCREENSHOTS.md` - a numbered checklist of every screenshot you need,
with the exact command for each one.

## Port Map (so nothing clashes)

| Service | URL |
|---------|-----|
| Q1 task-api | http://localhost:3000 |
| Q1 Prometheus | http://localhost:9090 |
| Q1 Grafana | http://localhost:3001 |
| Q2 MLflow UI | http://localhost:5000 |
| Q2 model API | http://localhost:8000 |
| Q2 Prometheus | http://localhost:9090 |
| Q2 Grafana | http://localhost:3001 |
| Q3 bookstore | http://localhost:3000 |
| Q3 Alertmanager | http://localhost:9093 |

Run only **one** stack at a time to avoid port clashes:

```bash
cd q1-ci-cd-pipeline     && docker compose up -d   # then: docker compose down
cd q2-mlflow-mlops       && docker compose up -d   # then: docker compose down
cd q3-end-to-end-devops  && docker compose up -d   # then: docker compose down -v
```

## Quick Start

```bash
# Q1 and Q3 (Node.js - already verified on this machine)
cd q1-ci-cd-pipeline     && npm install && npm run verify
cd q3-end-to-end-devops  && npm install && npm run verify

# Q2 (Python - virtual environment is already set up at .venv)
cd q2-mlflow-mlops
..\ .venv\Scripts\python.exe -m mlflow server --host 127.0.0.1 --port 5000 --backend-store-uri sqlite:///mlflow.db
# in a second terminal:
..\ .venv\Scripts\python.exe train.py --tracking-uri http://127.0.0.1:5000
```

## Pushing To GitHub

```bash
cd C:\Users\Umesh\DevOpsASS2
git init
git add .
git commit -m "DevOps assignment 2: CI/CD pipeline, MLflow MLOps, end-to-end DevOps"
git branch -M main
git remote add origin https://github.com/umesh2904x/DevOpsASS2.git
git push -u origin main
```

Do **not** commit `.venv/` - it is already in `.gitignore`.
