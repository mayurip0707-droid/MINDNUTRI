
import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    balanced_accuracy_score
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR, "data", "Sleep_health_and_lifestyle_dataset.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR, "models", "stress_model.pkl"
)

# Load existing dataset and model; do not train or overwrite anything.
df = pd.read_csv(DATASET_PATH)
model = joblib.load(MODEL_PATH)

df = df.drop(columns=["Person ID"])

def classify_stress(level):
    if level <= 3:
        return "Low"
    elif level <= 6:
        return "Moderate"
    return "High"

df["Stress Category"] = df["Stress Level"].apply(classify_stress)

X = df.drop(
    columns=["Stress Level", "Stress Category", "Sleep Disorder"]
).copy()

X["Systolic BP"] = pd.to_numeric(
    X["Blood Pressure"].astype(str).str.split("/").str[0],
    errors="coerce"
)

X["Diastolic BP"] = pd.to_numeric(
    X["Blood Pressure"].astype(str).str.split("/").str[1],
    errors="coerce"
)

X = X.drop(columns=["Blood Pressure"])
y = df["Stress Category"]

# Recreate the same fixed 80/20 split used by the training script.
_, X_test, _, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

predictions = model.predict(X_test)

print("\n========== SAVED STRESS MODEL EVALUATION ==========")
print("Dataset records:", len(df))
print("Test records:", len(X_test))
print("Model file:", MODEL_PATH)

print("\nAccuracy: {:.2f}%".format(
    accuracy_score(y_test, predictions) * 100
))

print("Balanced accuracy: {:.2f}%".format(
    balanced_accuracy_score(y_test, predictions) * 100
))

print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

print("Confusion matrix (rows=actual, columns=predicted):")
labels = ["High", "Low", "Moderate"]
print("Label order:", labels)
print(confusion_matrix(y_test, predictions, labels=labels))

if hasattr(model, "predict_proba"):
    probabilities = model.predict_proba(X_test)
    confidence = probabilities.max(axis=1)

    print("\nMean maximum predicted probability: {:.2f}%".format(
        confidence.mean() * 100
    ))

    print("Predictions with confidence below 60%: {}/{}".format(
        (confidence < 0.60).sum(), len(confidence)
    ))

print("\nEvaluation finished. The saved model was not modified.")
