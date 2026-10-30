
from pathlib import Path
import joblib
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "emotion_model_v2.pkl"
VECTORIZER_PATH = MODEL_DIR / "emotion_vectorizer_v2.pkl"

# New, manually written examples.
# These are not copied from the existing 299-example dataset.
TEST_DATA = {
    "happiness": [
        "I could not stop laughing at the reunion",
        "Getting selected for the course made my day",
        "I feel proud of what I accomplished",
        "The surprise party made me feel special",
        "I am enjoying every moment of this trip",
        "My heart feels full after that wonderful news",
        "I feel cheerful when I spend time with my friends",
        "Everything went better than I expected today",
        "I am grateful for this beautiful opportunity",
        "The achievement gave me a real sense of joy",
    ],
    "sadness": [
        "I miss the days when we were together",
        "Nothing feels enjoyable since that goodbye",
        "I feel empty after losing someone important",
        "I wish things had turned out differently",
        "I have been crying whenever I remember it",
        "The house feels lonely without them",
        "I feel disappointed and emotionally drained",
        "I cannot find comfort in things I usually like",
        "Their absence has been difficult to accept",
        "I feel heartbroken about how everything ended",
    ],
    "stress": [
        "I have several tasks due before tomorrow morning",
        "My workload keeps growing and I cannot catch up",
        "I feel overwhelmed by all these responsibilities",
        "There is not enough time to finish everything",
        "I am struggling to manage my busy schedule",
        "Thinking about my pending work makes me tense",
        "I keep rushing from one task to another",
        "I feel mentally exhausted from constant pressure",
        "Too many deadlines are competing for my attention",
        "I cannot relax because so much remains unfinished",
    ],
    "anger": [
        "I am furious that they ignored my boundaries",
        "Their unfair decision makes my blood boil",
        "I snapped after being blamed for their mistake",
        "I am fed up with their disrespectful behavior",
        "It irritates me when nobody listens to my side",
        "I feel outraged by the way they treated me",
        "I am angry that they broke their promise again",
        "Their careless actions have really annoyed me",
        "I cannot tolerate being spoken to like that",
        "I resent being held responsible for everything",
    ],
    "calm": [
        "My thoughts feel quiet and settled",
        "I am taking things slowly without rushing",
        "I feel composed even though the day is busy",
        "Sitting quietly helps me feel at ease",
        "I am comfortable with how things are right now",
        "My breathing is steady and my mind feels clear",
        "I can handle this situation without feeling agitated",
        "I feel peaceful while watching the rain",
        "There is no urgency in my mind at the moment",
        "I am relaxed and able to think clearly",
    ],
    "fear": [
        "I am frightened that someone may break in",
        "The strange noise outside made me feel unsafe",
        "I worry that something terrible might happen",
        "I am scared to walk through that dark passage",
        "The possibility of an accident keeps haunting me",
        "I feel uneasy about being alone in this place",
        "I am afraid of what the doctor might discover",
        "The threat made me fear for my safety",
        "I keep imagining the danger that could be waiting",
        "I am terrified that I might lose control",
    ],
}


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not VECTORIZER_PATH.exists():
        raise FileNotFoundError(f"Vectorizer not found: {VECTORIZER_PATH}")

    texts = []
    labels = []

    for emotion, examples in TEST_DATA.items():
        for sentence in examples:
            texts.append(sentence)
            labels.append(emotion)

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)

    features = vectorizer.transform(texts)
    predictions = model.predict(features)

    print("=" * 60)
    print("MINDNUTRI — INDEPENDENT EMOTION TEST")
    print("=" * 60)
    print(f"Test examples: {len(texts)}")
    print(f"Examples per emotion: {len(texts) // len(TEST_DATA)}")
    print("\nAccuracy:", f"{accuracy_score(labels, predictions) * 100:.2f}%")

    print("\nClassification report:")
    print(
        classification_report(
            labels,
            predictions,
            labels=sorted(TEST_DATA.keys()),
            zero_division=0,
            digits=3,
        )
    )

    class_names = sorted(TEST_DATA.keys())
    print("Confusion matrix (rows = actual, columns = predicted):")
    print(class_names)
    print(confusion_matrix(labels, predictions, labels=class_names))

    
    print("\nIndividual prediction errors:")
    errors = 0

    class_names = list(model.classes_)

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)
    else:
        probabilities = None

    for i, (sentence, actual, predicted) in enumerate(
        zip(texts, labels, predictions)
    ):
        if actual != predicted:
            errors += 1
            print(f"\nExpected: {actual} | Predicted: {predicted}")
            print(f"Text: {sentence}")

            if probabilities is not None:
                print("Emotion confidence scores:")

                ranked_scores = sorted(
                    zip(class_names, probabilities[i]),
                    key=lambda item: item[1],
                    reverse=True,
                )

                for emotion, score in ranked_scores:
                    print(f"  {emotion}: {score * 100:.2f}%")
            else:
                print("This model does not support predict_proba().")

    if errors == 0:
        print("No errors on this small test set.")

    print(f"\nIncorrect predictions: {errors}/{len(texts)}")
    print("\nEvaluation only. No model or vectorizer files were saved.")
    print(
        "Note: This is a small, manually authored test set, "
        "not a guarantee of real-world performance."
    )


if __name__ == "__main__":
    main()
