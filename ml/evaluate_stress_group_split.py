
import os
import pandas as pd

from sklearn.model_selection import GroupShuffleSplit
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report

base = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(base, "data", "Sleep_health_and_lifestyle_dataset.csv"))

df = df.drop(columns=["Person ID"])

def classify_stress(level):
    if level <= 3:
        return "Low"
    elif level <= 6:
        return "Moderate"
    return "High"

y = df["Stress Level"].apply(classify_stress)

X = df.drop(columns=["Stress Level", "Sleep Disorder"]).copy()
X["Systolic BP"] = pd.to_numeric(
    X["Blood Pressure"].astype(str).str.split("/").str[0],
    errors="coerce"
)
X["Diastolic BP"] = pd.to_numeric(
    X["Blood Pressure"].astype(str).str.split("/").str[1],
    errors="coerce"
)
X = X.drop(columns=["Blood Pressure"])

categorical = ["Gender", "Occupation", "BMI Category"]
numeric = [
    "Age", "Sleep Duration", "Quality of Sleep",
    "Physical Activity Level", "Heart Rate", "Daily Steps",
    "Systolic BP", "Diastolic BP"
]

preprocessor = ColumnTransformer([
    ("numeric", Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ]), numeric),
    ("categorical", Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ]), categorical)
])

# Identical feature rows are kept in the same group.
groups = pd.util.hash_pandas_object(X, index=False)

splitter = GroupShuffleSplit(
    n_splits=1, test_size=0.20, random_state=42
)
train_idx, test_idx = next(splitter.split(X, y, groups))

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced"
    ))
])

model.fit(X.iloc[train_idx], y.iloc[train_idx])
pred = model.predict(X.iloc[test_idx])

print("\n=== GROUP-SPLIT EVALUATION ===")
print("All records:", len(df))
print("Unique feature combinations:", groups.nunique())
print("Training records:", len(train_idx))
print("Testing records:", len(test_idx))
print("Train/test feature overlap:",
      len(set(groups.iloc[train_idx]) & set(groups.iloc[test_idx])))
print("Accuracy: {:.2f}%".format(accuracy_score(y.iloc[test_idx], pred) * 100))
print("Balanced accuracy: {:.2f}%".format(
    balanced_accuracy_score(y.iloc[test_idx], pred) * 100
))
print("\nClassification report:")
print(classification_report(y.iloc[test_idx], pred, zero_division=0))
print("\nTemporary model only; saved stress_model.pkl was not changed.")

