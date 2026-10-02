"""
Q2 - Serve the MLflow-registered model behind a REST API and expose
Prometheus metrics for Grafana dashboards.
"""

import os
import time

import mlflow
import numpy as np
import pandas as pd
import prometheus_client as pc
from flask import Flask, jsonify, request
from mlflow.models import infer_signature
from sklearn.preprocessing import StandardScaler
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

MODEL_NAME = os.getenv("MODEL_NAME", "cancer-detector")
ALIAS = os.getenv("MODEL_ALIAS", "champion")
TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")
SCALER_PATH = os.getenv("SCALER_PATH", "scaler.pkl")
USE_SCALER = os.getenv("USE_SCALER", "true").lower() == "true"

mlflow.set_tracking_uri(TRACKING_URI)

PREDICTIONS = Counter("ml_predictions_total", "Total prediction requests",
                      ["result"])
LATENCY = Histogram("ml_prediction_latency_seconds", "Prediction latency in seconds",
                    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0))
CONFIDENCE = Gauge("ml_prediction_confidence", "Confidence of the last prediction")
MODEL_INFO = Gauge("ml_model_info", "Model metadata", ["version", "run_id"])
BATCH_SIZE = Histogram("ml_batch_size", "Number of rows per predict call",
                       buckets=(1, 5, 10, 25, 50, 100))

app = Flask(__name__)
mlflow_model = None
scaler = None
meta = {"model_name": MODEL_NAME, "version": "unknown", "features": [], "classes": []}


def load_model():
    global mlflow_model, scaler
    print(f"Loading model '{MODEL_NAME}@{ALIAS}' from {TRACKING_URI}")
    mlflow_model = mlflow.pyfunc.load_model(f"models:/{MODEL_NAME}@{ALIAS}")
    try:
        scaler = joblib_load(SCALER_PATH)
    except Exception:
        scaler = None
    if os.path.exists("model_meta.json"):
        import json
        meta.update(json.load(open("model_meta.json")))

    client = getattr(mlflow, "MlflowClient", None) or mlflow.MLflowClient
    mv = client().get_model_version_by_alias(MODEL_NAME, ALIAS)
    MODEL_INFO.labels(version=str(mv.version), run_id=mv.run_id[:8]).set(1)
    print(f"Model loaded: version {mv.version}")
    return mlflow_model


def joblib_load(path):
    import joblib
    return joblib.load(path)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "UP" if mlflow_model is not None else "DOWN",
        "model": meta["model_name"],
        "version": meta["version"],
        "mlflow_uri": TRACKING_URI,
    })


@app.route("/metrics", methods=["GET"])
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@app.route("/predict", methods=["POST"])
def predict():
    if mlflow_model is None:
        return jsonify({"error": "model not loaded"}), 503

    payload = request.get_json(force=True, silent=True) or {}
    rows = payload.get("instances")
    if rows is None:
        return jsonify({"error": "send {\"instances\": [[...], ...]}"}), 400

    df = pd.DataFrame(rows)
    if list(df.columns) != meta["features"]:
        df.columns = meta["features"][: df.shape[1]]

    if scaler is not None and USE_SCALER:
        df = pd.DataFrame(scaler.transform(df), columns=df.columns)

    start = time.time()
    preds = mlflow_model.predict(df)
    LATENCY.observe(time.time() - start)
    BATCH_SIZE.observe(len(preds))

    if hasattr(mlflow_model, "predict_proba"):
        probs = mlflow_model.predict_proba(df)
        confidence = float(np.max(probs, axis=1))
    else:
        confidence = 1.0

    CONFIDENCE.set(float(np.mean(confidence)))
    for p in preds:
        PREDICTIONS.labels(result=str(p)).inc()

    labels = [meta["classes"][int(p)] if int(p) < len(meta["classes"]) else str(p) for p in preds]
    return jsonify({
        "predictions": labels,
        "prediction_ids": [int(p) for p in preds],
        "confidence": [round(float(c), 4) for c in confidence],
        "count": len(preds),
        "model_version": meta["version"],
    })


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
