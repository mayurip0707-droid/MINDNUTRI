import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# MINDWISEAI - STRESS PREDICTION MODEL
# ============================================================

print("=" * 70)
print("MindWiseAI - Stress Prediction Model Training")
print("=" * 70)


# ------------------------------------------------------------
# 1. Dataset path
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "data",
    "Sleep_health_and_lifestyle_dataset.csv"
)


# ------------------------------------------------------------
# 2. Load dataset
# ------------------------------------------------------------

df = pd.read_csv(DATASET_PATH)

print("\nDataset loaded successfully!")
print("Dataset shape:", df.shape)


# ------------------------------------------------------------
# 3. Remove unnecessary column
# ------------------------------------------------------------

df = df.drop(columns=["Person ID"])


# ------------------------------------------------------------
# 4. Convert Stress Level into categories
# ------------------------------------------------------------

def classify_stress(level):

    if level <= 3:
        return "Low"

    elif level <= 6:
        return "Moderate"

    else:
        return "High"


df["Stress Category"] = df["Stress Level"].apply(classify_stress)


# ------------------------------------------------------------
# 5. Show target distribution
# ------------------------------------------------------------

print("\nStress Category Distribution:")
print(df["Stress Category"].value_counts())


# ------------------------------------------------------------
# 6. Remove original numerical target
# ------------------------------------------------------------

X = df.drop(
    columns=[
        "Stress Level",
        "Stress Category",
        "Sleep Disorder"
    ]
)

y = df["Stress Category"]


# ------------------------------------------------------------
# 7. Convert Blood Pressure
# ------------------------------------------------------------

def extract_systolic(bp):

    try:
        return int(str(bp).split("/")[0])
    except:
        return np.nan


def extract_diastolic(bp):

    try:
        return int(str(bp).split("/")[1])
    except:
        return np.nan


X["Systolic BP"] = X["Blood Pressure"].apply(
    extract_systolic
)

X["Diastolic BP"] = X["Blood Pressure"].apply(
    extract_diastolic
)

X = X.drop(columns=["Blood Pressure"])


# ------------------------------------------------------------
# 8. Identify feature types
# ------------------------------------------------------------

categorical_features = [
    "Gender",
    "Occupation",
    "BMI Category"
]

numeric_features = [
    "Age",
    "Sleep Duration",
    "Quality of Sleep",
    "Physical Activity Level",
    "Heart Rate",
    "Daily Steps",
    "Systolic BP",
    "Diastolic BP"
]


# ------------------------------------------------------------
# 9. Preprocessing
# ------------------------------------------------------------

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        ),
        (
            "scaler",
            StandardScaler()
        )
    ]
)


categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numeric_features
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features
        )
    ]
)


# ------------------------------------------------------------
# 10. Train/Test Split
# ------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples :", len(X_test))


# ============================================================
# 11. Logistic Regression
# ============================================================

logistic_model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000
            )
        )
    ]
)


print("\n" + "-" * 70)
print("Training Logistic Regression...")
print("-" * 70)

logistic_model.fit(X_train, y_train)

logistic_predictions = logistic_model.predict(X_test)

logistic_accuracy = accuracy_score(
    y_test,
    logistic_predictions
)

print("\nLogistic Regression Accuracy:")
print(f"{logistic_accuracy * 100:.2f}%")


# ============================================================
# 12. Random Forest
# ============================================================

random_forest_model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=300,
                random_state=42,
                class_weight="balanced"
            )
        )
    ]
)


print("\n" + "-" * 70)
print("Training Random Forest...")
print("-" * 70)

random_forest_model.fit(X_train, y_train)

rf_predictions = random_forest_model.predict(X_test)

rf_accuracy = accuracy_score(
    y_test,
    rf_predictions
)

print("\nRandom Forest Accuracy:")
print(f"{rf_accuracy * 100:.2f}%")


# ============================================================
# 13. Model Comparison
# ============================================================

print("\n" + "=" * 70)
print("MODEL COMPARISON")
print("=" * 70)

print(
    f"Logistic Regression : {logistic_accuracy * 100:.2f}%"
)

print(
    f"Random Forest       : {rf_accuracy * 100:.2f}%"
)


# ============================================================
# 14. Select Best Model
# ============================================================

if rf_accuracy >= logistic_accuracy:

    best_model = random_forest_model
    best_name = "Random Forest"
    best_predictions = rf_predictions
    best_accuracy = rf_accuracy

else:

    best_model = logistic_model
    best_name = "Logistic Regression"
    best_predictions = logistic_predictions
    best_accuracy = logistic_accuracy


print("\nBest Model:")
print(best_name)

print(
    f"Best Accuracy: {best_accuracy * 100:.2f}%"
)


# ============================================================
# 15. Classification Report
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_test,
        best_predictions
    )
)


# ============================================================
# 16. Confusion Matrix
# ============================================================

print("\n" + "=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

print(
    confusion_matrix(
        y_test,
        best_predictions
    )
)


# ============================================================
# 17. Save model
# ============================================================

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


MODEL_PATH = os.path.join(
    MODEL_DIR,
    "stress_model.pkl"
)


joblib.dump(
    best_model,
    MODEL_PATH
)


print("\n" + "=" * 70)
print("MODEL SAVED SUCCESSFULLY!")
print("=" * 70)

print("\nModel:", best_name)

print("Saved at:")
print(MODEL_PATH)

print("\nTraining completed successfully!")