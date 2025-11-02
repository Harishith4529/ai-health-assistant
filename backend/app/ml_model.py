# backend/app/ml_model.py

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from typing import List, Tuple

# Paths (adjust if your data is in another folder)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # go one folder up (from app/ to backend/)
DATA_DIR = os.path.join(BASE_DIR, "data")              # go into data folder
DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")
SEVERITY_PATH = os.path.join(DATA_DIR, "Symptom-severity.csv")
DESC_PATH = os.path.join(DATA_DIR, "symptom_Description.csv")
PRECAUTION_PATH = os.path.join(DATA_DIR, "symptom_precaution.csv")
MODEL_PATH = os.path.join(DATA_DIR, "model.joblib")

# -------------------------------
# TRAINING PIPELINE
# -------------------------------

def train_model():
    """Train ML model from dataset.csv and save it."""
    df = pd.read_csv(DATASET_PATH)
    symptom_severity = pd.read_csv(SEVERITY_PATH)

    # Normalize column names
    df.columns = df.columns.str.strip()
    symptom_severity["Symptom"] = symptom_severity["Symptom"].str.strip().str.lower()

    # Convert symptoms to lower case
    for col in df.columns:
        if col.startswith("Symptom"):
            df[col] = df[col].str.strip().str.lower()

    # Build a list of all unique symptoms
    all_symptoms = sorted(symptom_severity["Symptom"].unique())

    # Create feature matrix (binary: 1 if symptom present)
    X = []
    for _, row in df.iterrows():
        features = [1 if sym in row.values else 0 for sym in all_symptoms]
        X.append(features)
    X = pd.DataFrame(X, columns=all_symptoms)

    y = df["Disease"]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train model
    model = RandomForestClassifier(n_estimators=150, random_state=42)
    model.fit(X_train, y_train)

    # Save model + feature order
    joblib.dump({"model": model, "symptoms": all_symptoms}, MODEL_PATH)
    print("✅ Model trained and saved at:", MODEL_PATH)
    print("Accuracy:", round(model.score(X_test, y_test), 3))


# -------------------------------
# PREDICTION PIPELINE
# -------------------------------

def load_resources():
    """Load trained model and metadata."""
    if not os.path.exists(MODEL_PATH):
        train_model()
    bundle = joblib.load(MODEL_PATH)
    return bundle["model"], bundle["symptoms"]


def predict(symptoms: List[str]) -> List[Tuple[str, float]]:
    """Predict disease from a list of symptom strings."""
    model, all_symptoms = load_resources()

    # Create input vector
    input_vec = [1 if s.lower() in symptoms else 0 for s in all_symptoms]
    probs = model.predict_proba([input_vec])[0]
    classes = model.classes_

    # Sort results by probability
    ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
    top3 = [(d, round(p, 3)) for d, p in ranked[:3]]
    return top3


def get_description_precautions(disease: str):
    """Get disease description and precautions from CSVs."""
    desc_df = pd.read_csv(DESC_PATH)
    pre_df = pd.read_csv(PRECAUTION_PATH)

    desc = desc_df.loc[desc_df["Disease"].str.lower() == disease.lower(), "Description"]
    desc = desc.values[0] if len(desc) else "Description not available."

    pre_row = pre_df.loc[pre_df["Disease"].str.lower() == disease.lower()]
    precautions = []
    if not pre_row.empty:
        for i in range(1, 5):
            col = f"Precaution_{i}"
            if col in pre_row.columns and pd.notna(pre_row.iloc[0][col]):
                precautions.append(pre_row.iloc[0][col])

    return {"description": desc, "precautions": precautions}

def compute_risk_score(symptoms: list) -> float:
    """
    Compute total risk score based on Symptom-severity.csv weights.
    Returns a normalized risk score (0–10 scale).
    """
    sev_path = SEVERITY_PATH
    if not os.path.exists(sev_path):
        return 0.0

    df = pd.read_csv(sev_path)
    df["Symptom"] = df["Symptom"].str.strip().str.lower()

    # Create dict {symptom: weight}
    sev_map = dict(zip(df["Symptom"], df["weight"]))

    total_weight = 0
    for s in symptoms:
        total_weight += sev_map.get(s.lower(), 0)

    # Normalize: divide by max possible weight (assume 17 symptoms * max 10)
    normalized = min(total_weight / 17, 10)
    return round(normalized, 2)
