
from pathlib import Path
import ast
from collections import defaultdict

MOOD_DIR = Path(__file__).resolve().parent

datasets = [
    ("mood_engine.py", "emotion_texts", "emotion_labels"),
    ("emotion_dataset_v2.py", "emotion_texts_v2", None),
    ("emotion_dataset_v3.py", "emotion_texts_v3", None),
    ("emotion_dataset_v4.py", "emotion_texts_v4", None),
]

records = []

for filename, text_variable, label_variable in datasets:
    path = MOOD_DIR / filename
    tree = ast.parse(path.read_text(encoding="utf-8"))

    values = {}

    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if target.id == text_variable:
                        values[text_variable] = ast.literal_eval(node.value)

                    elif label_variable and target.id == label_variable:
                        values[label_variable] = eval(
                            compile(
                                ast.Expression(body=node.value),
                                str(path),
                                "eval",
                            ),
                            {"__builtins__": {}},
                        )

    texts = values.get(text_variable)

    if texts is None:
        raise RuntimeError(f"Could not read {text_variable} from {filename}")

    if isinstance(texts, dict):
        for emotion, examples in texts.items():
            for text in examples:
                records.append((text, emotion, filename))
    else:
        labels = values.get(label_variable)

        if labels is None or len(texts) != len(labels):
            raise RuntimeError(f"Text/label mismatch in {filename}")

        for text, emotion in zip(texts, labels):
            records.append((text, emotion, filename))

# Exact duplicates after simple normalization
groups = defaultdict(list)

for text, emotion, filename in records:
    normalized = " ".join(text.lower().split())
    groups[normalized].append((text, emotion, filename))

duplicates = {
    text: items for text, items in groups.items()
    if len(items) > 1
}

print("=" * 60)
print("MINDNUTRI EMOTION DATASET DUPLICATE CHECK")
print("=" * 60)
print(f"Total examples: {len(records)}")
print(f"Unique normalized sentences: {len(groups)}")
print(f"Duplicate sentence groups: {len(duplicates)}")

for normalized, items in duplicates.items():
    print(f"\nSentence: {normalized}")
    for original, emotion, filename in items:
        print(f"  Emotion: {emotion} | File: {filename}")

# Same exact sentence assigned to different emotions
conflicts = {
    text: items for text, items in duplicates.items()
    if len({emotion for _, emotion, _ in items}) > 1
}

print(f"\nConflicting-label duplicate groups: {len(conflicts)}")
print("Check completed. No files were modified.")
