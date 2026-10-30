
from pathlib import Path
import ast
import sys
from emotion_dataset_v4 import emotion_texts_v4
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

# --------------------------------------------------
# PATHS
# --------------------------------------------------

MOOD_DIR = Path(__file__).resolve().parent
ENGINE_PATH = MOOD_DIR / "mood_engine.py"

sys.path.insert(0, str(MOOD_DIR))

from emotion_dataset_v2 import emotion_texts_v2
from emotion_dataset_v3 import emotion_texts_v3

# --------------------------------------------------
# LOAD ORIGINAL DATA WITHOUT IMPORTING mood_engine
# --------------------------------------------------

tree = ast.parse(ENGINE_PATH.read_text(encoding="utf-8"))

original_texts = None
original_labels = None

for node in tree.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                if target.id == "emotion_texts":
                    original_texts = ast.literal_eval(node.value)

                elif target.id == "emotion_labels":
                    original_labels = eval(
                        compile(
                            ast.Expression(body=node.value),
                            str(ENGINE_PATH),
                            "eval",
                        ),
                        {"__builtins__": {}},
                    )

if original_texts is None or original_labels is None:
    raise RuntimeError(
        "Could not load original emotion data from mood_engine.py"
    )

texts = list(original_texts)
labels = list(original_labels)

for dataset in (
    emotion_texts_v2,
    emotion_texts_v3,
    emotion_texts_v4,
):
    for emotion, examples in dataset.items():
        texts.extend(examples)
        labels.extend([emotion] * len(examples))

if len(texts) != len(labels):
    raise ValueError("Text and label counts do not match.")

class_names = sorted(set(labels))

if len(class_names) != 6:
    raise ValueError(f"Expected 6 emotion classes, got {class_names}")

print("=" * 60)
print("MINDNUTRI EMOTION MODEL - 5-FOLD CROSS-VALIDATION")
print("=" * 60)

print(f"\nTotal examples: {len(texts)}")
print("\nClass counts:")

for emotion in class_names:
    print(f"{emotion}: {labels.count(emotion)}")

# --------------------------------------------------
# PIPELINE
# Vectorizers are fitted separately inside each fold.
# --------------------------------------------------

pipeline = Pipeline([
    (
        "features",
        FeatureUnion([
            (
                "word",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    sublinear_tf=True,
                    min_df=1,
                    max_features=50000,
                ),
            ),
        ]),
    ),
    (
        "classifier",
        LogisticRegression(
            C=2,
            max_iter=3000,
            class_weight="balanced",
            random_state=42,
        ),
    ),
])

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)

# Each prediction comes from a model that did not train on that example.
predictions = cross_val_predict(
    pipeline,
    texts,
    labels,
    cv=cv,
    method="predict",
)

accuracy = accuracy_score(labels, predictions) * 100

print("\nOverall out-of-fold accuracy:")
print(f"{accuracy:.2f}%")

print("\nClassification report:")
print(
    classification_report(
        labels,
        predictions,
        labels=class_names,
        zero_division=0,
        digits=3,
    )
)

print("\nConfusion matrix")
print("Rows = actual emotion; columns = predicted emotion")
print(class_names)
print(confusion_matrix(labels, predictions, labels=class_names))

print("\nEvaluation completed.")
print("No model files were saved or overwritten.")
print(
    "Note: Results are cross-validation estimates on this dataset, "
    "not a guarantee of real-world performance."
)
