
from pathlib import Path
import joblib
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

model = joblib.load(MODEL_DIR / "emotion_model_v2.pkl")
vectorizer = joblib.load(MODEL_DIR / "emotion_vectorizer_v2.pkl")

sentences = [
    ("fear", "The threat made me fear for my safety"),
    ("happiness", "I could not stop laughing at the reunion"),
    ("sadness", "Their absence has been difficult to accept"),
]

for actual, sentence in sentences:
    features = vectorizer.transform([sentence])
    prediction = model.predict(features)[0]

    print("\n" + "=" * 65)
    print("Sentence:", sentence)
    print("Expected:", actual)
    print("Predicted:", prediction)

    if hasattr(model, "predict_proba"):
        scores = model.predict_proba(features)[0]
        ranked = sorted(
            zip(model.classes_, scores),
            key=lambda item: item[1],
            reverse=True,
        )

        print("\nEmotion scores:")
        for emotion, score in ranked:
            print(f"  {emotion}: {score * 100:.2f}%")

    
    
    print("\nActive word and character feature contributions:")

    transformers = dict(vectorizer.transformer_list)
    word_vectorizer = transformers["word"]
    char_vectorizer = transformers["char"]

    word_names = word_vectorizer.get_feature_names_out()
    char_names = char_vectorizer.get_feature_names_out()
    word_count = len(word_names)

    word_values = word_vectorizer.transform([sentence]).toarray()[0]
    char_values = char_vectorizer.transform([sentence]).toarray()[0]

    active_features = []

    for idx in np.flatnonzero(word_values):
        active_features.append(
            (word_names[idx], word_values[idx], idx, "word")
        )

    for idx in np.flatnonzero(char_values):
        active_features.append(
            (
                char_names[idx],
                char_values[idx],
                word_count + idx,
                "char",
            )
        )

    active_features.sort(key=lambda item: item[1], reverse=True)

    for term, value, feature_index, feature_type in active_features[:20]:
        contributions = model.coef_[:, feature_index] * value

        ranked = sorted(
            zip(model.classes_, contributions),
            key=lambda item: item[1],
            reverse=True,
        )

        print(
            f"\n  {feature_type}: {term} | TF-IDF: {value:.4f}"
        )

        for emotion, contribution in ranked[:3]:
            print(f"    {emotion}: {contribution:+.4f}")

print("\nDiagnostic only. No files were modified.")
