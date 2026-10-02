"""
Simple load test that hits /predict many times so Prometheus has data
to scrape and Grafana has graphs to show.
"""

import argparse
import json
import random
import time

import requests

FEATURES = [
    "mean radius", "mean texture", "mean perimeter", "mean area", "mean smoothness",
    "mean compactness", "mean concavity", "mean concave points", "mean symmetry",
    "mean fractal dimension", "radius error", "texture error", "perimeter error",
    "area error", "smoothness error", "compactness error", "concavity error",
    "concave points error", "symmetry error", "fractal dimension error",
    "worst radius", "worst texture", "worst perimeter", "worst area", "worst smoothness",
    "worst compactness", "worst concavity", "worst concave points", "worst symmetry",
    "worst fractal dimension",
]


def random_row():
    return [
        random.uniform(6, 30), random.uniform(10, 40), random.uniform(40, 250),
        random.uniform(100, 2500), random.uniform(0.08, 0.16), random.uniform(0.02, 0.35),
        random.uniform(0.01, 0.35), random.uniform(0.0, 0.2), random.uniform(0.1, 0.3),
        random.uniform(0.04, 0.1), random.uniform(0.1, 3.0), random.uniform(0.1, 6.0),
        random.uniform(1.0, 30.0), random.uniform(10, 700), random.uniform(0.002, 0.05),
        random.uniform(0.005, 0.06), random.uniform(0.0, 0.06), random.uniform(0.0, 0.05),
        random.uniform(0.008, 0.07), random.uniform(0.002, 0.03), random.uniform(8, 42),
        random.uniform(10, 60), random.uniform(50, 300), random.uniform(150, 3000),
        random.uniform(0.07, 0.3), random.uniform(0.02, 0.4), random.uniform(0.01, 0.5),
        random.uniform(0.0, 0.3), random.uniform(0.1, 0.6), random.uniform(0.02, 0.15),
    ]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://127.0.0.1:8000/predict")
    p.add_argument("--requests", type=int, default=200)
    p.add_argument("--batch", type=int, default=1)
    p.add_argument("--delay", type=float, default=0.2)
    args = p.parse_args()

    ok = 0
    for i in range(args.requests):
        rows = [random_row() for _ in range(args.batch)]
        payload = {"instances": [dict(zip(FEATURES, r)) for r in rows]}
        try:
            r = requests.post(args.url, json=payload, timeout=10)
            if r.status_code == 200:
                ok += 1
            if i % 25 == 0:
                print(f"{i}/{args.requests} -> {r.status_code} {r.text[:120]}")
        except Exception as exc:
            print(f"error at {i}: {exc}")
        time.sleep(args.delay)

    print(f"\nDone. successful={ok}/{args.requests}")


if __name__ == "__main__":
    main()
