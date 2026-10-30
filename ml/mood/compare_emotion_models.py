
import ast
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, f1_score, classification_report


ROOT = Path(__file__).resolve().parents[2]
MOOD_DIR = ROOT / "ml" / "mood"
ENGINE_FILE = MOOD_DIR / "mood_engine.py"

# Load original emotion data without importing mood_engine.py.

tree = ast.parse(ENGINE_FILE.read_text(encoding="utf-8"))

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
                            str(ENGINE_FILE),
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

# Import the additional datasets.
from emotion_dataset_v2 import emotion_texts_v2
from emotion_dataset_v3 import emotion_texts_v3
from emotion_dataset_v4 import emotion_texts_v4

for dataset in (
    emotion_texts_v2,
    emotion_texts_v3,
    emotion_texts_v4,
):
    for label_value, examples in dataset.items():
        for text_value in examples:
            texts.append(text_value)
            labels.append(label_value)

# Remove exact normalized duplicates, keeping the first occurrence.
seen = set()
unique_texts = []
unique_labels = []

for text_value, label_value in zip(texts, labels):
    normalized = re.sub(r"\s+", " ", text_value.strip().lower())

    if normalized in seen:
        continue

    seen.add(normalized)
    unique_texts.append(text_value)
    unique_labels.append(label_value)

texts = unique_texts
labels = unique_labels

if len(texts) != len(labels):
    raise ValueError("Texts and labels have different lengths.")

if not texts:
    raise ValueError("No dataset examples were loaded.")

class_counts = {
    label: labels.count(label)
    for label in sorted(set(labels))
}

if min(class_counts.values()) < 5:
    raise ValueError(
        "Each emotion needs at least 5 examples for 5-fold cross-validation."
    )

print("=" * 60)
print("MINDNUTRI EMOTION MODEL — C VALUE COMPARISON")
print("=" * 60)
print(f"Total unique examples: {len(texts)}")
print(f"Emotion classes: {len(class_counts)}")
print("\nClass distribution:")

for label, count in class_counts.items():
    print(f"  {label}: {count}")

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)

c_values = [0.5, 1, 2, 4, 8]
results = []

for c_value in c_values:
    model = Pipeline([
        (
            "features",
            FeatureUnion([
                (
                    "word_tfidf",
                    TfidfVectorizer(
                        ngram_range=(1, 2),
                        lowercase=True,
                        strip_accents="unicode",
                        sublinear_tf=True,
                        min_df=1,
                    ),
                ),
                (
                    "char_tfidf",
                    TfidfVectorizer(
                        analyzer="char_wb",
                        ngram_range=(3, 5),
                        max_features=50000,
                        sublinear_tf=True,
                    ),
                ),
            ]),
        ),
        (
            "classifier",
            LogisticRegression(
                C=c_value,
                max_iter=3000,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ])

    predictions = cross_val_predict(
        model,
        texts,
        labels,
        cv=cv,
        n_jobs=-1,
    )

    accuracy = accuracy_score(labels, predictions)
    macro_f1 = f1_score(
        labels,
        predictions,
        average="macro",
        zero_division=0,
    )
    weighted_f1 = f1_score(
        labels,
        predictions,
        average="weighted",
        zero_division=0,
    )

    results.append(
        (c_value, accuracy, macro_f1, weighted_f1, predictions)
    )

    print(f"\nC = {c_value}")
    print(f"  Accuracy:   {accuracy * 100:.2f}%")
    print(f"  Macro F1:   {macro_f1:.4f}")
    print(f"  Weighted F1:{weighted_f1:.4f}")

print("\n" + "=" * 60)
print("COMPARISON SUMMARY")
print("=" * 60)
print(f"{'C':<10}{'Accuracy':<15}{'Macro F1':<15}{'Weighted F1'}")

for c_value, accuracy, macro_f1, weighted_f1, _ in results:
    print(
        f"{c_value:<10}"
        f"{accuracy * 100:<15.2f}"
        f"{macro_f1:<15.4f}"
        f"{weighted_f1:.4f}"
    )

best_result = max(results, key=lambda item: item[2])

print("\nBest C by Macro F1:")
print(f"C = {best_result[0]}")
print(f"Macro F1 = {best_result[2]:.4f}")
print(f"Accuracy = {best_result[1] * 100:.2f}%")

print("\nClassification report for best C:")
print(
    classification_report(
        labels,
        best_result[4],
        zero_division=0,
    )
)

print("\nEvaluation only: no model files were saved or overwritten.")
print(
    "Note: Results on curated examples may be optimistic; "
    "independent test data is needed to estimate real-world performance."
)
