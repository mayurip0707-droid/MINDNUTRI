
from pathlib import Path
import joblib
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "emotion_model_v2.pkl"
VECTORIZER_PATH = MODEL_DIR / "emotion_vectorizer_v2.pkl"

TEST_DATA = {
    "anger": [
        "I am furious about being treated unfairly",
        "Their rude comments made me lose my temper",
        "I am frustrated that nobody respects my boundaries",
        "I cannot stand their constant blaming",
        "That selfish decision made me angry",
    ],
    "calm": [
        "I feel peaceful and comfortable right now",
        "My mind is quiet and I am relaxed",
        "I can deal with this situation calmly",
        "I feel balanced and at ease today",
        "I am taking a slow and peaceful break",
    ],
    "fear": [
        "I am scared that someone is following me",
        "I fear that something bad is about to happen",
        "That threatening sound made me feel unsafe",
        "I am frightened by the possibility of danger",
        "I feel afraid to enter the dark room alone",
    ],
    "happiness": [
        "I am delighted with my wonderful achievement",
        "Spending time with my friends made me joyful",
        "I feel thrilled about the exciting news",
        "Today brought me so much happiness",
        "I am proud and pleased with my progress",
    ],
    "sadness": [
        "I feel heartbroken after saying goodbye",
        "I miss someone who is no longer here",
        "Nothing seems enjoyable since the loss",
        "I feel deeply disappointed and lonely",
        "I am grieving and struggling emotionally",
    ],
    "stress": [
        "I have too many deadlines to meet",
        "My responsibilities are making me overwhelmed",
        "I feel tense because I have very little time",
        "My workload is exhausting me mentally",
        "I cannot relax because several tasks remain",
    ],
}


def main():
    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        raise FileNotFoundError("Saved model or vectorizer is missing.")

    texts = []
    labels = []

    for emotion, sentences in TEST_DATA.items():
        for sentence in sentences:
            texts.append(sentence)
            labels.append(emotion)

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)

    predictions = model.predict(vectorizer.transform(texts))

    print("=" * 55)
    print("MINDNUTRI - FINAL VALIDATION")
    print("=" * 55)
    print("Test examples:", len(texts))
    print(f"Accuracy: {accuracy_score(labels, predictions) * 100:.2f}%")
    print("\nClassification report:")
    print(classification_report(labels, predictions, zero_division=0))

    print("\nIncorrect predictions:")
    errors = 0
    for sentence, actual, predicted in zip(texts, labels, predictions):
        if actual != predicted:
            errors += 1
            print(f"Expected: {actual} | Predicted: {predicted}")
            print(f"Text: {sentence}")

    print(f"\nErrors: {errors}/{len(texts)}")
    print("Evaluation only. No model files were modified.")
    print("Note: This is a small diagnostic set, not a definitive benchmark.")


if __name__ == "__main__":
    main()

