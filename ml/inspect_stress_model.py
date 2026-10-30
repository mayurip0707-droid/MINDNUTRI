
from pathlib import Path
import joblib

# Project root and saved model path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "stress_model.pkl"

print("\n========== STRESS MODEL INSPECTION ==========")
print("Model path:", MODEL_PATH)
print("Model file exists:", MODEL_PATH.exists())

if not MODEL_PATH.exists():
    print("ERROR: Saved model file was not found.")
    raise SystemExit(1)

model = joblib.load(MODEL_PATH)

print("\n--- Model structure ---")
print(model)

print("\n--- Pipeline steps ---")
if hasattr(model, "named_steps"):
    for name, step in model.named_steps.items():
        print(f"{name}: {type(step).__name__}")
else:
    print("The saved object is not a standard sklearn Pipeline.")

print("\n--- Expected input features ---")
if hasattr(model, "feature_names_in_"):
    print(list(model.feature_names_in_))
elif hasattr(model, "named_steps"):
    for name, step in model.named_steps.items():
        if hasattr(step, "feature_names_in_"):
            print(name, list(step.feature_names_in_))
else:
    print("Feature names are not exposed by the saved object.")

print("\n--- Prediction classes ---")
if hasattr(model, "classes_"):
    print(list(model.classes_))
elif hasattr(model, "named_steps"):
    for name, step in model.named_steps.items():
        if hasattr(step, "classes_"):
            print(name, list(step.classes_))
else:
    print("Classes are not exposed by the saved object.")

print("\n--- Probability support ---")
print("Has predict_proba:", hasattr(model, "predict_proba"))

print("\n========== INSPECTION COMPLETE ==========")
