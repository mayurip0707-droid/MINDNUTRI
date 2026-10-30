import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path

# ============================================================
# MindWiseAI - Sleep Disorder Prediction Model
# ============================================================

# Dataset path
DATA_PATH = "data/Sleep_health_and_lifestyle_dataset.csv"

# Load dataset
df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("MindWiseAI - ML Model Training")
print("=" * 60)

print("\nDataset loaded successfully!")
print("Shape:", df.shape)

# ============================================================
# Data Preprocessing
# ============================================================

# Fill missing target values
df["Sleep Disorder"] = df["Sleep Disorder"].fillna("No Disorder")

# Split Blood Pressure into two columns
df[["Systolic BP", "Diastolic BP"]] = df["Blood Pressure"].str.split(
    "/", expand=True
)

# Convert BP columns to numeric
df["Systolic BP"] = pd.to_numeric(df["Systolic BP"])
df["Diastolic BP"] = pd.to_numeric(df["Diastolic BP"])

# Remove original Blood Pressure column
df = df.drop(columns=["Blood Pressure"])

print("\nData preprocessing completed!")

# ============================================================
# Features and Target
# ============================================================

X = df.drop(columns=["Sleep Disorder", "Person ID"])
y = df["Sleep Disorder"]

print("\nFeatures shape:", X.shape)
print("Target shape:", y.shape)

print("\nTarget distribution:")
print(y.value_counts())

print("\nFeature columns:")
print(X.columns.tolist())

# ============================================================
# Train-Test Split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", X_train.shape[0])
print("Testing samples:", X_test.shape[0])

# ============================================================
# Feature Preprocessing
# ============================================================

categorical_features = [
    "Gender",
    "Occupation",
    "BMI Category"
]

numerical_features = [
    "Age",
    "Sleep Duration",
    "Quality of Sleep",
    "Physical Activity Level",
    "Stress Level",
    "Heart Rate",
    "Daily Steps",
    "Systolic BP",
    "Diastolic BP"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)

# ============================================================
# Random Forest Model
# ============================================================

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=200,
                random_state=42,
                class_weight="balanced"
            )
        )
    ]
)

print("\nModel created successfully!")

# ============================================================
# Train Model
# ============================================================

print("\nTraining model...")

model.fit(X_train, y_train)

print("Model training completed successfully!")

# ============================================================
# Model Evaluation
# ============================================================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n" + "=" * 60)
print("MODEL RESULTS")
print("=" * 60)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ============================================================
# Save Model
# ============================================================

models_dir = Path("models")
models_dir.mkdir(exist_ok=True)

model_path = models_dir / "sleep_disorder_model.pkl"

joblib.dump(model, model_path)

print("\n" + "=" * 60)
print("MODEL SAVED SUCCESSFULLY!")
print("=" * 60)

print("\nSaved at:")
print(model_path.resolve())