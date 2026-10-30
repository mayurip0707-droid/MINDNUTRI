
from pathlib import Path
import ast
import sys

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import confusion_matrix

MOOD_DIR = Path(__file__).resolve().parent
ENGINE_PATH = MOOD_DIR / "mood_engine.py"

sys.path.insert(0, str(MOOD_DIR))

from emotion_dataset_v2 import emotion_texts_v2
from emotion_dataset_v3 import emotion_texts_v3
from emotion_dataset_v4 import emotion_texts_v4

# Read original examples without importing mood_engine.
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
    raise RuntimeError("Could not load original emotion examples.")

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

class_names = sorted(set(labels))

# All vectorizer fitting happens inside each CV fold.
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

predictions = cross_val_predict(
    pipeline,
    texts,
    labels,
    cv=cv,
    method="predict",
)

print("=" * 70)
print("MINDNUTRI - OUT-OF-FOLD EMOTION ERRORS")
print("=" * 70)

errors = []

for text, actual, predicted in zip(texts, labels, predictions):
    if actual != predicted:
        errors.append((actual, predicted, text))

print(f"\nTotal examples: {len(texts)}")
print(f"Incorrect predictions: {len(errors)}")
print(
    f"Out-of-fold accuracy: "
    f"{(len(texts) - len(errors)) / len(texts) * 100:.2f}%"
)

print("\nCONFUSION MATRIX")
print("Labels:", class_names)
print("Rows = actual; columns = predicted")
print(confusion_matrix(labels, predictions, labels=class_names))

print("\nMISCLASSIFIED SENTENCES")
for index, (actual, predicted, text) in enumerate(errors, start=1):
    print(f"\n{index}. Actual: {actual} | Predicted: {predicted}")
    print(f"   Text: {text}")

print("\nError analysis complete. No model or dataset files were changed.")
