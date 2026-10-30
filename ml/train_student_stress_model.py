
from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# Project paths
ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "Student_Stress_Level_Dataset.csv"
MODEL_DIR = ML_DIR / "models"
MODEL_PATH = MODEL_DIR / "student_stress_model.pkl"

# Load dataset
data = pd.read_csv(DATA_PATH)

if "stress_level" not in data.columns:
    raise ValueError("Dataset is missing the stress_level target column.")

data = data.dropna().drop_duplicates()

X = data.drop(columns=["stress_level"])
y = data["stress_level"]

# Preserve a separate test set
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

# Train baseline model
model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
)

model.fit(X_train, y_train)

# Evaluate on unseen test data
predictions = model.predict(X_test)

print("Dataset rows:", len(data))
print("Training rows:", len(X_train))
print("Test rows:", len(X_test))
print("Test accuracy:", round(accuracy_score(y_test, predictions), 4))

print("\nClassification report:")
print(classification_report(y_test, predictions))

print("Confusion matrix:")
print(confusion_matrix(y_test, predictions))

# Save separately; do not overwrite the existing model
MODEL_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_PATH)

print("\nNew model saved to:")
print(MODEL_PATH)
