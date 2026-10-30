from pathlib import Path
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report

from emotion_dataset_v2 import emotion_texts_v2
from emotion_dataset_v3 import emotion_texts_v3

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Importing mood_engine may retrain and overwrite existing models.
# Therefore, load its original dataset definitions from the saved source
# without importing/executing the module.
import ast

ENGINE_PATH = Path(__file__).resolve().parent / "mood_engine.py"
source = ENGINE_PATH.read_text(encoding="utf-8")
tree = ast.parse(source, filename=str(ENGINE_PATH))

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
        "Could not read emotion_texts/emotion_labels from mood_engine.py. "
        "No model files were changed."
    )

texts = list(original_texts)
labels = list(original_labels)

for dataset in (emotion_texts_v2, emotion_texts_v3):
    for emotion, examples in dataset.items():
        texts.extend(examples)
        labels.extend([emotion] * len(examples))

if len(texts) != len(labels):
    raise ValueError(f"Text/label count mismatch: {len(texts)} vs {len(labels)}")

if len(set(labels)) != 6:
    raise ValueError(f"Expected 6 emotion classes, found: {set(labels)}")

print(f"Total examples: {len(texts)}")
print("Class counts:")
for label in sorted(set(labels)):
    print(f"  {label}: {labels.count(label)}")

# Word and character features are combined in a separate emotion vectorizer.
emotion_vectorizer = FeatureUnion([
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
])

emotion_features = emotion_vectorizer.fit_transform(texts)

emotion_model = LogisticRegression(
    C=2,
    max_iter=3000,
    class_weight="balanced",
    random_state=42,
)

# Cross-validation evaluates the training examples; it is not a guarantee
# of performance on unseen real-world messages.
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(
    emotion_model,
    emotion_features,
    labels,
    cv=cv,
    scoring="accuracy",
)

print("\n5-fold cross-validation:")
print("Fold scores:", [round(float(score) * 100, 2) for score in scores])
print(f"Mean accuracy: {scores.mean() * 100:.2f}%")
print(f"Standard deviation: {scores.std() * 100:.2f}%")

# Fit the final model on all available examples.
emotion_model.fit(emotion_features, labels)

# Use new filenames so existing sentiment/shared-vectorizer files remain intact.
model_path = MODEL_DIR / "emotion_model_v2.pkl"
vectorizer_path = MODEL_DIR / "emotion_vectorizer_v2.pkl"

joblib.dump(emotion_model, model_path)
joblib.dump(emotion_vectorizer, vectorizer_path)

print("\nTraining completed.")
print(f"Emotion model saved: {model_path}")
print(f"Emotion vectorizer saved: {vectorizer_path}")
print("Existing sentiment model and shared vectorizer were not intentionally modified.")