# Q2 - MLOps with MLflow, Prometheus and Grafana

Full ML lifecycle: experiment tracking, model registry, deployment and monitoring.

## What This Shows

| MLflow capability | Where |
|-------------------|-------|
| Experiment tracking | 6 runs in one experiment `breast-cancer-classifier` |
| Parameter logging | `algorithm`, `C`, `n_estimators`, `use_scaler`, `test_size`, `random_state` |
| Metric logging | `accuracy`, `precision`, `recall`, `f1`, `roc_auc` |
| Run comparison | comparison table logged as an MLflow artifact |
| Model logging | `mlflow.sklearn.log_model` with signature + input example |
| Model versioning | `cancer-detector` registry, auto-incremented versions |
| Model stage/alias | alias `champion`, tags, `Production` stage |
| Deployment | Flask API loading the model from the registry |

Plus **application monitoring** with Prometheus (custom metrics) and Grafana
(auto-provisioned dashboard).

## Project Layout

```
q2-mlflow-mlops/
├── train.py                  trains 6 candidate models, tracks, registers best
├── serve_model.py            Flask API + Prometheus /metrics
├── load_test.py              traffic generator so dashboards have data
├── requirements.txt
├── Dockerfile
├── docker-compose.yml        mlflow + trainer + model-server + prometheus + grafana
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
│       ├── provisioning/datasources/datasources.yml
│       ├── provisioning/dashboards/dashboards.yml
│       └── dashboards/mlops-dashboard.json
└── .github/workflows/mlops.yml
```

## Run Locally

Terminal 1 - tracking server:

```bash
python -m mlflow server --host 127.0.0.1 --port 5000 --backend-store-uri sqlite:///mlflow.db
```

Terminal 2 - training:

```bash
python train.py --tracking-uri http://127.0.0.1:5000
```

Terminal 3 - serving:

```bash
python serve_model.py
```

Terminal 4 - generate traffic:

```bash
python load_test.py --requests 200 --delay 0.2
```

| Service | URL |
|---------|-----|
| MLflow UI | http://localhost:5000 |
| Model API | http://localhost:8000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (`admin` / `admin123`) |

## Run With Docker (recommended)

```bash
docker compose up -d --build
docker compose logs -f trainer      # watch the 6 runs
docker compose exec model-server python load_test.py --requests 300
```

## Model API

### `GET /health`

```json
{ "status": "UP", "model": "cancer-detector", "version": "1", "mlflow_uri": "http://mlflow:5000" }
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"instances":[{"mean radius":17.4,"mean texture":19.2, "...":0.0}]}'
```

```json
{
  "predictions": ["benign"],
  "prediction_ids": [0],
  "confidence": [0.9934],
  "count": 1,
  "model_version": "1"
}
```

### `GET /metrics`

Prometheus exposition format:

```
ml_predictions_total{result="0"} 142.0
ml_prediction_latency_seconds_bucket{le="0.025"} 88.0
ml_prediction_confidence 0.9912
ml_batch_size_bucket{le="5"} 142.0
ml_model_info{run_id="a1b2c3d4",version="1"} 1.0
```

## Custom Metrics

| Metric | Type | Meaning |
|--------|------|---------|
| `ml_predictions_total{result}` | Counter | predictions by class (0 = benign, 1 = malignant) |
| `ml_prediction_latency_seconds` | Histogram | inference latency, p50/p95 visible in Grafana |
| `ml_prediction_confidence` | Gauge | mean confidence of the latest batch |
| `ml_batch_size` | Histogram | rows per predict call |
| `ml_model_info{version,run_id}` | Gauge | which model version is live |

The `ml_model_info` gauge is the key monitoring check - if a redeploy changes the
model version, the Grafana label value changes too.

## The Experiments

Six candidates, all tracked under one experiment:

| Run | Algorithm | Key params |
|-----|-----------|------------|
| trial_1_logistic_regression | LogisticRegression | C=0.1 |
| trial_2_logistic_regression | LogisticRegression | C=1.0 |
| trial_3_logistic_regression | LogisticRegression | C=10.0 |
| trial_4_random_forest | RandomForestClassifier | n_estimators=50 |
| trial_5_random_forest | RandomForestClassifier | n_estimators=200 |
| trial_6_svc | SVC (RBF) | C=1.0 |

`train.py` then picks the highest-`f1` run, registers it as a new version of
`cancer-detector`, sets the `champion` alias and tags it with the metric values.

## CI/CD

`.github/workflows/mlops.yml` runs on pushes to `main` that touch ML files, weekly,
or on demand:

1. **train** - starts an MLflow service container, runs `train.py`, prints the run
   comparison table into the job summary
2. **test** - verifies `serve_model.py` imports cleanly
3. **deploy** - builds the image, starts the stack, smoke tests `/health` and `/predict`
4. **monitor** - starts Prometheus + Grafana and asserts both report healthy and
   the Prometheus target is `UP`

## Screenshots Needed

See `../docs/SCREENSHOTS.md` (Q2-01 to Q2-09).

## Troubleshooting

`ImportError: DLL load failed ... An Application Control policy has blocked this file`
means a Windows WDAC/AppLocker policy on your laptop is blocking compiled Python
packages. Use `docker compose up trainer` or let GitHub Actions run it on Ubuntu -
neither is affected.
