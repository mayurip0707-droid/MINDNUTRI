
from pathlib import Path
import ast
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

BASE_DIR = Path(__file__).resolve().parents[1]
MOOD_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "emotion_model_v2.pkl"
VECTORIZER_PATH = MODEL_DIR / "emotion_vectorizer_v2.pkl"
ENGINE_PATH = MOOD_DIR / "mood_engine.py"

# Read the original examples without importing mood_engine.
tree = ast.parse(ENGINE_PATH.read_text(encoding="utf-8"))

texts = None
labels = None

for node in tree.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                if target.id == "emotion_texts":
                    texts = ast.literal_eval(node.value)
                elif target.id == "emotion_labels":
                    labels = eval(
                        compile(
                            ast.Expression(body=node.value),
                            str(ENGINE_PATH),
                            "eval",
                        ),
                        {"__builtins__": {}},
                    )

if texts is None or labels is None:
    raise RuntimeError("Could not load the original emotion dataset.")

if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
    raise FileNotFoundError("The v2 model or vectorizer file is missing.")

# Load v2 and v3 datasets.
import sys
sys.path.insert(0, str(MOOD_DIR))

from emotion_dataset_v2 import emotion_texts_v2
from emotion_dataset_v3 import emotion_texts_v3

texts = list(texts)
labels = list(labels)

for dataset in (emotion_texts_v2, emotion_texts_v3):
    for emotion, examples in dataset.items():
        texts.extend(examples)
        labels.extend([emotion] * len(examples))

# Hold out unseen-to-training examples for a test split.
X_train, X_test, y_train, y_test = train_test_split(
    texts,
    labels,
    test_size=0.20,
    random_state=42,
    stratify=labels,
)

# This is a diagnostic split using the existing model, which was trained
# on all these examples. It is NOT a valid independent accuracy estimate.
print("WARNING: The saved v2 model has already seen this dataset.")
print("This report is diagnostic only, not a valid test accuracy.\n")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

X_test_features = vectorizer.transform(X_test)
predictions = model.predict(X_test_features)

print("Diagnostic accuracy:", round(accuracy_score(y_test, predictions) * 100, 2), "%")
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

print("Confusion matrix (labels sorted alphabetically):")
class_names = sorted(set(labels))
print(class_names)
print(confusion_matrix(y_test, predictions, labels=class_names))
