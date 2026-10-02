"""
Q2 - MLflow experiment tracking + model registry.

Trains several candidate models, logs parameters and metrics for each run,
compares them, promotes the best model to the MLflow Model Registry with
stage/alias tags, and stages it for deployment.
"""

import argparse
import os
import warnings

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from mlflow.models import infer_signature
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

warnings.filterwarnings("ignore")

EXPERIMENT_NAME = "breast-cancer-classifier"
MODEL_NAME = "cancer-detector"
RANDOM_STATE = 42


def get_data():
    data = load_breast_cancer()
    X = pd.DataFrame(data.data, columns=data.feature_names)
    y = pd.Series(data.target, name="label")
    return X, y, data.target_names


def evaluate(y_true, y_pred, y_prob):
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
    }


def build_models():
    return {
        "logistic_regression": lambda C: LogisticRegression(
            C=C, max_iter=2000, random_state=RANDOM_STATE
        ),
        "random_forest": lambda n: RandomForestClassifier(
            n_estimators=n, random_state=RANDOM_STATE, n_jobs=-1
        ),
        "svc": lambda C: SVC(C=C, probability=True, random_state=RANDOM_STATE),
    }


def run_trials():
    X, y, class_names = get_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    trials = [
        ("logistic_regression", {"C": 0.1}),
        ("logistic_regression", {"C": 1.0}),
        ("logistic_regression", {"C": 10.0}),
        ("random_forest", {"n_estimators": 50}),
        ("random_forest", {"n_estimators": 200}),
        ("svc", {"C": 1.0}),
    ]

    models = build_models()
    results = []

    for i, (algo, params) in enumerate(trials, start=1):
        tag = f"trial_{i}_{algo}"
        print(f"\n[{i}/{len(trials)}] running {tag} {params}")

        with mlflow.start_run(run_name=tag, tags={"algo": algo, "trial": str(i)}):
            use_scaler = algo in ("logistic_regression", "svc")
            Xtr = X_train_s if use_scaler else X_train
            Xte = X_test_s if use_scaler else X_test

            model = models[algo](list(params.values())[0])
            model.fit(Xtr, y_train)
            pred = model.predict(Xte)
            prob = model.predict_proba(Xte)[:, 1]

            mlflow.log_param("algorithm", algo)
            for k, v in params.items():
                mlflow.log_param(k, v)
            mlflow.log_param("use_scaler", use_scaler)
            mlflow.log_param("test_size", 0.2)
            mlflow.log_param("random_state", RANDOM_STATE)

            for k, v in evaluate(y_test, pred, prob).items():
                mlflow.log_metric(k, v)

            mlflow.log_metric("train_rows", len(Xtr))
            mlflow.log_metric("feature_count", X.shape[1])

            mlflow.log_text(
                classification_report(y_test, pred, target_names=class_names),
                "classification_report.txt",
            )
            mlflow.log_text(str(confusion_matrix(y_test, pred)), "confusion_matrix.txt")

            mlflow.sklearn.log_model(
                sk_model=model,
                name="model",
                input_example=Xte[:5],
                signature=infer_signature(Xte, pred),
            )

            mlflow.set_tag("status", "trained")
            results.append({"run_id": mlflow.active_run().info.run_id, "tag": tag,
                            "algo": algo, "params": params, **evaluate(y_test, pred, prob)})

    return results, class_names, scaler, X.columns.tolist()


def log_comparison(results):
    df = pd.DataFrame(results).sort_values("f1", ascending=False)
    df.to_csv("mlruns/experiment_comparison.csv", index=False)
    print("\n=== Experiment comparison (sorted by f1) ===")
    print(df[["tag", "algo", "accuracy", "f1", "roc_auc"]].to_string(index=False))
    mlflow.log_table(df, "experiment_comparison.json")


def promote_best(results):
    best = max(results, key=lambda r: r["f1"])
    print(f"\nBest run: {best['tag']} with f1={best['f1']:.4f}")

    client = mlflow.MLflowClient()

    model_uri = f"runs:/{best['run_id']}/model"
    registered = mlflow.register_model(model_uri=model_uri, name=MODEL_NAME)
    print(f"Registered {MODEL_NAME} version {registered.version}")

    client.set_registered_model_alias(MODEL_NAME, "champion", registered.version)
    client.set_model_version_tag(MODEL_NAME, registered.version, "f1_score", f"{best['f1']:.4f}")
    client.set_model_version_tag(MODEL_NAME, registered.version, "algo", best["algo"])
    client.set_model_version_tag(MODEL_NAME, registered.version, "stage", "production")

    try:
        client.transition_model_version_stage(MODEL_NAME, registered.version, "Production")
        client.transition_model_version_stage(MODEL_NAME, registered.version, "Staging")
    except Exception as exc:
        print(f"stage transition skipped (MLflow 3 behaviour): {exc}")

    print(f"\nCurrent versions of {MODEL_NAME}:")
    for mv in client.search_model_versions(f"name='{MODEL_NAME}'"):
        print(f"  version={mv.version} run_id={mv.run_id} tags={dict(mv.tags)}")
        for a in mv.aliases:
            print(f"    alias -> {a.alias}")

    return registered.version


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tracking-uri", default=os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:5000"))
    args = parser.parse_args()

    mlflow.set_tracking_uri(args.tracking_uri)
    os.makedirs("mlruns", exist_ok=True)

    exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
    if exp is None:
        mlflow.create_experiment(EXPERIMENT_NAME)
    mlflow.set_experiment(EXPERIMENT_NAME)

    print(f"Tracking URI : {mlflow.get_tracking_uri()}")
    print(f"Experiment   : {EXPERIMENT_NAME}")

    results, class_names, scaler, features = run_trials()
    log_comparison(results)
    version = promote_best(results)

    import joblib

    joblib.dump(scaler, "scaler.pkl")
    print("Scaler saved to scaler.pkl (needed for linear/SVM inference)")

    with open("model_meta.json", "w") as f:
        import json
        json.dump({"model_name": MODEL_NAME, "version": version,
                   "features": features, "classes": list(class_names)}, f, indent=2)

    print("\nMLflow pipeline finished. Open http://127.0.0.1:5000 to view the runs.")


if __name__ == "__main__":
    main()
