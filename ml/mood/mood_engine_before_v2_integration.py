import re
import os
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


# ============================================================
# MINDNUTRI LOCAL MOOD NLP ENGINE
# No External API
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODEL_DIR, exist_ok=True)

SENTIMENT_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "sentiment_model.pkl"
)

EMOTION_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "emotion_model.pkl"
)

VECTORIZER_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "mood_vectorizer.pkl"
)


# ============================================================
# TEXT PREPROCESSING
# ============================================================

def clean_text(text):

    text = str(text).lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+", " ", text)

    # Remove special characters
    text = re.sub(r"[^a-zA-Z\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


# ============================================================
# LOCAL TRAINING DATA
# ============================================================

training_texts = [

    # ---------------- POSITIVE ----------------

    "I am feeling happy today",
    "Today was a wonderful day",
    "I feel great and positive",
    "I had a very good day",
    "I am excited about my future",
    "I feel peaceful and relaxed",
    "I enjoyed spending time with my family",
    "I completed my work and feel proud",
    "Today made me smile",
    "I feel motivated and energetic",
    "I am grateful for everything",
    "I had a beautiful experience today",
    "I feel confident today",
    "Everything went really well",
    "I am feeling hopeful",

    # ---------------- NEGATIVE ----------------

    "I feel very sad today",
    "Today was a terrible day",
    "I am feeling depressed and tired",
    "I feel lonely",
    "Nothing seems to be going right",
    "I am worried about everything",
    "I feel hopeless",
    "I had a very bad day",
    "I feel exhausted and unhappy",
    "I am struggling with my emotions",
    "I feel disappointed",
    "I cannot stop worrying",
    "I feel emotionally drained",
    "I am feeling low today",
    "Everything feels difficult",

    # Stress and overwhelm
    "Today was exhausting and stressful",
    "I had too much work and feel stressed",
    "I feel overwhelmed by my workload",
    "I am under a lot of pressure",
    "I am mentally exhausted from work",
    "I am anxious and worried about exams",
    "I cannot stop overthinking",
    "I feel tense and unable to relax",
    "I am struggling to manage my stress",
    "Everything feels overwhelming today",

    # ---------------- NEUTRAL ----------------

    "Today was an ordinary day",
    "I went to college today",
    "I completed my daily tasks",
    "I studied for a few hours",
    "I worked on my project",
    "I had lunch with my friends",
    "I stayed at home today",
    "I attended my classes",
    "I finished my assignments",
    "I followed my normal routine",
    "I went for a walk",
    "I watched a movie",
    "I cleaned my room",
    "I prepared my food",
    "I spent the day studying",
]

sentiment_labels = (
    ["positive"] * 15
    + ["negative"] * 25
    + ["neutral"] * 15
)


# ============================================================
# EMOTION TRAINING DATA
# ============================================================

emotion_texts = [

    # HAPPINESS — 20 examples
    "I feel happy and cheerful today",
    "I am joyful and excited",
    "Today was wonderful and enjoyable",
    "I feel proud of what I achieved",
    "I am grateful for my life",
    "I had a great time with my friends",
    "I feel positive about my future",
    "I am smiling and feeling good",
    "I feel delighted with my success",
    "Everything went well today",
    "I feel motivated and enthusiastic",
    "I enjoyed every moment today",
    "I feel loved and appreciated",
    "I am excited about my achievement",
    "Today brought me a lot of joy",
    "I feel confident and optimistic",
    "I am pleased with my progress",
    "I had a lovely and peaceful day",
    "I feel energetic and cheerful",
    "I am happy with how things turned out",

    # SADNESS — 20 examples
    "I feel sad and unhappy today",
    "I feel lonely and left out",
    "I am disappointed with everything",
    "I feel heartbroken and upset",
    "I miss someone very much",
    "I feel empty and emotionally low",
    "I have been crying today",
    "Nothing seems to make me happy",
    "I feel rejected and unwanted",
    "I am grieving a painful loss",
    "I feel hopeless about my situation",
    "I am deeply hurt by what happened",
    "I feel miserable and down",
    "I cannot stop feeling sad",
    "I feel isolated from everyone",
    "I am upset about my failure",
    "I feel discouraged and low",
    "I am struggling with sadness",
    "Today has left me feeling unhappy",
    "I feel emotionally hurt and alone",

    # STRESS — 20 examples
    "I feel stressed and overwhelmed",
    "I am mentally exhausted from too much work",
    "I am under pressure from deadlines",
    "I have too many responsibilities to handle",
    "My workload is making me anxious and tired",
    "I feel drained after a hectic day",
    "I cannot manage all these tasks",
    "I feel tense because of my exams",
    "Everything feels overwhelming right now",
    "I need a break from all this pressure",
    "I am struggling to cope with my workload",
    "My mind feels overloaded with tasks",
    "I feel exhausted and unable to relax",
    "I have too much work and no time",
    "I am worried about completing my deadlines",
    "I feel burned out from constant work",
    "Today was hectic and mentally draining",
    "I feel pressured by my responsibilities",
    "I am finding it difficult to manage stress",
    "I feel overwhelmed and need some rest",

    # ANGER — 20 examples
    "I am angry about what happened",
    "I feel frustrated with this situation",
    "Everything is irritating me today",
    "I am furious about being treated unfairly",
    "I feel annoyed by everyone's behaviour",
    "I am losing my patience",
    "This situation makes me really angry",
    "I feel resentful about what they did",
    "I am fed up with these repeated problems",
    "I feel irritated and aggressive",
    "Their actions made me furious",
    "I cannot tolerate this unfair treatment",
    "I am upset and angry with everyone",
    "I feel frustrated because nothing is working",
    "I am annoyed by constant interruptions",
    "I feel bitter about this argument",
    "I am angry that nobody listens to me",
    "This keeps making me lose my temper",
    "I feel outraged by their decision",
    "I am irritated and cannot calm down",

    # CALM — 20 examples
    "I feel calm and relaxed today",
    "My mind feels peaceful and quiet",
    "I am comfortable with my situation",
    "I feel balanced and at ease",
    "I enjoyed a quiet relaxing day",
    "I feel peaceful inside",
    "I am relaxed and not worried",
    "I feel settled and comfortable",
    "I can handle things at my own pace",
    "I feel emotionally balanced today",
    "I am enjoying this peaceful moment",
    "My mind feels clear and relaxed",
    "I feel composed during a busy day",
    "I am content and at peace",
    "I feel safe and comfortable",
    "I am taking things slowly and calmly",
    "I feel refreshed and relaxed",
    "I am not feeling pressured right now",
    "I feel steady and in control",
    "Today has been calm and manageable",

    # FEAR — 20 examples
    "I feel scared about what might happen",
    "I am afraid of failing",
    "I feel nervous about the future",
    "I am frightened by this situation",
    "I feel unsafe and worried",
    "I am afraid something bad will happen",
    "I feel anxious about an uncertain outcome",
    "I am terrified of making a mistake",
    "I feel nervous before my presentation",
    "I am worried about a possible danger",
    "I feel fearful and uncertain",
    "I am scared to face this situation",
    "I feel panicked about what is happening",
    "I am afraid of losing someone",
    "I feel uneasy about the unknown",
    "I am nervous about what people will think",
    "I feel frightened and helpless",
    "I am scared about the result",
    "I feel alarmed by this unexpected event",
    "I am worried because I do not feel safe",
]

emotion_labels = (
    ["happiness"] * 20
    + ["sadness"] * 20
    + ["stress"] * 20
    + ["anger"] * 20
    + ["calm"] * 20
    + ["fear"] * 20
)


# ============================================================
# CREATE VECTORIZER
# ============================================================

all_texts = training_texts + emotion_texts

vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words="english",
    ngram_range=(1, 2)
)

vectorizer.fit(
    [clean_text(text) for text in all_texts]
)


# ============================================================
# TRAIN SENTIMENT MODEL
# ============================================================

sentiment_model = LogisticRegression(
    max_iter=1000
)

sentiment_features = vectorizer.transform(
    [clean_text(text) for text in training_texts]
)

sentiment_model.fit(
    sentiment_features,
    sentiment_labels
)


# ============================================================
# TRAIN EMOTION MODEL
# ============================================================

emotion_model = LogisticRegression(
    max_iter=1000
)

emotion_features = vectorizer.transform(
    [clean_text(text) for text in emotion_texts]
)

emotion_model.fit(
    emotion_features,
    emotion_labels
)


# ============================================================
# SAVE MODELS
# ============================================================

joblib.dump(
    sentiment_model,
    SENTIMENT_MODEL_PATH
)

joblib.dump(
    emotion_model,
    EMOTION_MODEL_PATH
)

joblib.dump(
    vectorizer,
    VECTORIZER_MODEL_PATH
)


# ============================================================
# LOAD MODELS
# ============================================================

def load_models():

    sentiment = joblib.load(
        SENTIMENT_MODEL_PATH
    )

    emotion = joblib.load(
        EMOTION_MODEL_PATH
    )

    vectorizer = joblib.load(
        VECTORIZER_MODEL_PATH
    )

    return sentiment, emotion, vectorizer


# ============================================================
# SENTIMENT PREDICTION
# ============================================================

def predict_sentiment(text):

    sentiment_model, _, vectorizer = load_models()

    cleaned = clean_text(text)

    features = vectorizer.transform(
        [cleaned]
    )

    prediction = sentiment_model.predict(
        features
    )[0]

    probabilities = sentiment_model.predict_proba(
        features
    )[0]

    confidence = max(probabilities) * 100

    return {
        "sentiment": prediction,
        "confidence": round(confidence, 2)
    }


# ============================================================
# EMOTION PREDICTION
# ============================================================

def predict_emotion(text):

    _, emotion_model, vectorizer = load_models()

    cleaned = clean_text(text)

    features = vectorizer.transform(
        [cleaned]
    )

    prediction = emotion_model.predict(
        features
    )[0]

    probabilities = emotion_model.predict_proba(
        features
    )[0]

    confidence = max(probabilities) * 100

    return {
        "emotion": prediction,
        "confidence": round(confidence, 2)
    }

# ============================================================
# CONTINUOUS MOOD SCORE
# ============================================================

def calculate_mood_score(
    sentiment_result,
    emotion_result
):

    # --------------------------------------------------------
    # Get sentiment probabilities
    # --------------------------------------------------------

    sentiment_confidence = (
        float(
            sentiment_result.get(
                "confidence",
                0
            )
        )
        / 100
    )

    sentiment = (
        sentiment_result.get(
            "sentiment",
            "neutral"
        )
    )

    # --------------------------------------------------------
    # Base score from sentiment
    # --------------------------------------------------------

    if sentiment == "positive":

        base_score = (
            60
            + (sentiment_confidence * 40)
        )

    elif sentiment == "negative":

        base_score = (
            60
            - (sentiment_confidence * 40)
        )

    else:

        base_score = 60

    # --------------------------------------------------------
    # Adjust score using detected emotion
    # --------------------------------------------------------

    emotion = (
        emotion_result.get(
            "emotion",
            "neutral"
        )
    )

    emotion_confidence = (
        float(
            emotion_result.get(
                "confidence",
                0
            )
        )
        / 100
    )

    if emotion == "happiness":

        base_score += (
            8 * emotion_confidence
        )

    elif emotion == "calm":

        base_score += (
            5 * emotion_confidence
        )

    elif emotion == "stress":

        base_score -= (
            12 * emotion_confidence
        )

    elif emotion == "sadness":

        base_score -= (
            15 * emotion_confidence
        )

    elif emotion == "anger":

        base_score -= (
            12 * emotion_confidence
        )

    elif emotion == "fear":

        base_score -= (
            15 * emotion_confidence
        )

    # --------------------------------------------------------
    # Keep score between 0 and 100
    # --------------------------------------------------------

    mood_score = min(
        max(
            base_score,
            0
        ),
        100
    )

    return round(
        mood_score,
        1
    )

# ============================================================
# JOURNAL-BASED POSITIVE MOMENT EXTRACTION
# ============================================================

def extract_positive_moment(text):

    sentences = re.split(
        r"[.!?]+",
        str(text)
    )

    positive_words = [
        "happy",
        "good",
        "great",
        "wonderful",
        "love",
        "enjoyed",
        "excited",
        "proud",
        "grateful",
        "peaceful",
        "calm",
        "beautiful",
        "success",
        "achieved",
        "achievement",
        "completed",
        "finished",
        "learned",
        "improved",
        "helped",
        "support",
        "smile",
        "fun",
        "motivated",
        "confident",
        "relaxed"
    ]

    best_sentence = None
    best_score = 0

    for sentence in sentences:

        sentence = sentence.strip()

        if not sentence:
            continue

        lower_sentence = sentence.lower()

        score = 0

        for word in positive_words:

            if word in lower_sentence:
                score += 1

        if score > best_score:

            best_score = score
            best_sentence = sentence

    if best_sentence:
        return best_sentence

    return None


# ============================================================
# PERSONALIZED JOURNAL-BASED SUPPORTIVE MESSAGE
# ============================================================

def get_supportive_message(
    sentiment,
    emotion,
    positive_moment=None,
    journal_text=""
):

    journal_text = str(
        journal_text
    ).strip()

    # --------------------------------------------------------
    # Positive journal
    # --------------------------------------------------------

    if sentiment == "positive":

        if positive_moment:

            return (
                f"Your journal highlights a positive moment: "
                f"\"{positive_moment}\". "
                f"Notice and appreciate these moments because "
                f"they can help you understand what contributes "
                f"to your wellbeing."
            )

        return (
            "Your journal reflects a positive experience. "
            "Keep noticing the activities and moments that "
            "help you feel motivated and happy."
        )

    # --------------------------------------------------------
    # Stress
    # --------------------------------------------------------

    if emotion == "stress":

        if positive_moment:

            return (
                f"Your journal shows some stress, but it also "
                f"contains a positive moment: "
                f"\"{positive_moment}\". "
                f"Recognizing what went well can help you "
                f"balance difficult moments with positive ones."
            )

        return (
            "Your journal suggests that you experienced some "
            "stress today. Try taking a short break and notice "
            "one small thing that went well during your day."
        )

    # --------------------------------------------------------
    # Sadness
    # --------------------------------------------------------

    if emotion == "sadness":

        if positive_moment:

            return (
                f"Even though your journal reflects a difficult "
                f"moment, you mentioned: "
                f"\"{positive_moment}\". "
                f"That positive experience is worth noticing."
            )

        return (
            "Your journal suggests that today may have felt "
            "difficult. Be gentle with yourself and try to "
            "notice one small positive moment from your day."
        )

    # --------------------------------------------------------
    # Anger
    # --------------------------------------------------------

    if emotion == "anger":

        if positive_moment:

            return (
                f"Your journal contains a challenging moment, "
                f"but you also mentioned: "
                f"\"{positive_moment}\". "
                f"Giving attention to that positive experience "
                f"may help you reflect on your day more fully."
            )

        return (
            "Your journal suggests some frustration today. "
            "Taking a little space before reacting and noticing "
            "what went well may help you reflect more calmly."
        )

    # --------------------------------------------------------
    # Fear / Worry
    # --------------------------------------------------------

    if emotion == "fear":

        if positive_moment:

            return (
                f"Your journal includes some worry, but it also "
                f"highlights: "
                f"\"{positive_moment}\". "
                f"Remembering what went well can provide a more "
                f"balanced view of your day."
            )

        return (
            "Your journal suggests that something made you feel "
            "worried today. Try focusing on what is within your "
            "control and notice one thing that went well."
        )

    # --------------------------------------------------------
    # Calm
    # --------------------------------------------------------

    if emotion == "calm":

        if positive_moment:

            return (
                f"Your journal reflects a calm experience, "
                f"especially in this moment: "
                f"\"{positive_moment}\". "
                f"Keep noticing activities that help you maintain "
                f"this sense of balance."
            )

        return (
            "Your journal reflects a calm experience today. "
            "Continue making time for activities that help "
            "you feel relaxed and balanced."
        )

    # --------------------------------------------------------
    # Neutral
    # --------------------------------------------------------

    if positive_moment:

        return (
            f"Your day may have felt fairly ordinary, but your "
            f"journal still contains a positive moment: "
            f"\"{positive_moment}\". "
            f"Small moments like these can be useful to notice "
            f"over time."
        )

    return (
        "Thank you for checking in with yourself today. "
        "Regular journaling can help you understand your "
        "mood patterns and notice meaningful moments over time."
    )

# ============================================================
# JOURNAL-BASED DETAILED INSIGHT
# ============================================================


def generate_journal_insight(
    text,
    sentiment,
    emotion,
    mood_score,
    positive_moment=None
):
    journal = str(text).strip()
    lower_text = journal.lower()

    def has_any(words):
        return any(
            re.search(r"\b" + re.escape(word) + r"\b", lower_text)
            for word in words
        )

    themes = {
        "Academic / Study": [
            "college", "study", "studies", "studying", "exam",
            "assignment", "project", "presentation", "class",
            "topic", "teacher", "learning", "learned", "practice"
        ],
        "Work / Career": [
            "work", "office", "job", "career", "deadline",
            "meeting", "colleague", "manager", "interview"
        ],
        "Family / Social": [
            "family", "friend", "friends", "parents", "sister",
            "brother", "relationship", "conversation", "lonely"
        ],
        "Self-care / Wellbeing": [
            "sleep", "rest", "tired", "exhausted", "walk",
            "exercise", "relax", "health", "peaceful"
        ],
    }

    theme_scores = {
        theme: sum(
            1 for word in words
            if re.search(r"\b" + re.escape(word) + r"\b", lower_text)
        )
        for theme, words in themes.items()
    }

    main_theme = max(theme_scores, key=theme_scores.get)
    if theme_scores[main_theme] == 0:
        main_theme = "Personal Wellbeing"

    challenge_words = [
        "stress", "stressed", "anxious", "anxiety", "worried",
        "worry", "fear", "afraid", "sad", "sadness", "disappointed",
        "difficult", "struggled", "struggle", "overwhelmed",
        "exhausted", "tired", "doubted", "doubt", "angry",
        "frustrated", "lonely", "confused", "nervous"
    ]

    positive_words = [
        "happy", "happiness", "proud", "relieved", "relief",
        "grateful", "enjoyed", "confident", "calm", "completed",
        "achieved", "understood", "improved", "success", "hopeful",
        "motivated", "smiled", "supported"
    ]

    action_words = [
        "asked for help", "practiced", "practice", "tried",
        "talked", "shared", "completed", "learned", "understood",
        "solved", "rested", "walked", "decided", "managed"
    ]

    has_challenge = has_any(challenge_words)
    has_positive = has_any(positive_words)
    has_action = has_any(action_words)

    if has_challenge and has_positive and has_action:
        emotional_pattern = "Challenge → Action → Positive outcome"
        insight = (
            f"Your journal focuses on {main_theme.lower()}. "
            "You describe a difficult experience, then mention an action "
            "you took and a more positive result. This suggests that "
            "working through the difficulty helped you make some progress, "
            "although it does not necessarily mean all your concerns are resolved."
        )
        recommendation = (
            "Notice which action helped you move forward today. "
            "You could use a similar small step for the concern that is still on your mind."
        )

    elif has_challenge and has_positive:
        emotional_pattern = "Mixed emotional experience"
        insight = (
            f"Your journal focuses on {main_theme.lower()} and includes "
            "both difficult feelings and positive experiences. "
            "These feelings can exist at the same time; the positive parts "
            "do not automatically remove the challenges you described."
        )
        recommendation = (
            "Identify which part of the day is still bothering you and "
            "one thing that helped, even a little."
        )

    elif has_challenge:
        emotional_pattern = "Ongoing challenge"
        insight = (
            f"Your journal mainly focuses on {main_theme.lower()}. "
            "You describe some difficult feelings, but the entry does not "
            "clearly mention a positive resolution. It may help to identify "
            "the specific concern that needs your attention first."
        )
        recommendation = (
            "Choose one manageable next step, or consider asking someone you trust for support."
        )

    elif has_positive:
        emotional_pattern = "Positive experience"
        insight = (
            f"Your journal highlights {main_theme.lower()} and includes "
            "some positive experiences or progress. Reflecting on what "
            "contributed to that moment may help you understand what supports your wellbeing."
        )
        recommendation = (
            "Take a moment to recognise what went well and what helped make it possible."
        )

    else:
        emotional_pattern = "Reflection / unclear emotional pattern"
        insight = (
            f"Your journal touches on {main_theme.lower()}, but the entry "
            "does not provide enough clear emotional cues to identify a "
            "strong pattern. Adding what happened, how you felt, and what "
            "happened next may help produce a more specific reflection."
        )
        recommendation = (
            "Try writing one sentence about the main event and another about how it made you feel."
        )

    if positive_moment:
        positive_trigger = positive_moment
    else:
        positive_trigger = (
            "No clear positive moment identified in this entry."
        )

    return {
        "main_theme": main_theme,
        "emotional_pattern": emotional_pattern,
        "positive_trigger": positive_trigger,
        "insight": insight,
        "recommendation": recommendation,
        "mood_score": mood_score,
        "detected_emotion": emotion,
        "detected_sentiment": sentiment,
    }



def generate_local_ai_insight(
    text,
    sentiment,
    emotion,
    mood_score,
    positive_moment=None
):
    """Generate journal insights using local Ollama without requests."""

    import json
    import urllib.request

    prompt = f"""
You are MINDNUTRI, a thoughtful and supportive journal reflection assistant.
Analyze the actual journal carefully. Do not invent details or give generic advice.
Return ONLY a valid JSON object with these keys:
main_theme, emotional_pattern, positive_trigger, insight, recommendation.

Sentiment: {sentiment}
Detected emotion: {emotion}
Mood score: {mood_score}
Positive moment: {positive_moment}
Journal text: {text}
"""

    try:
        payload = {
            "model": "qwen2.5:3b",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.3}
        }

        req = urllib.request.Request(
            "http://127.0.0.1:11434/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))

        insight = json.loads(result["response"])

        required_keys = [
            "main_theme",
            "emotional_pattern",
            "positive_trigger",
            "insight",
            "recommendation"
        ]

        if not all(key in insight for key in required_keys):
            raise ValueError("Local AI returned incomplete insight.")

        insight["mood_score"] = mood_score
        insight["detected_emotion"] = emotion
        insight["detected_sentiment"] = sentiment
        insight["ai_source"] = "local_ollama"

        return insight

    except Exception as error:
        print(f"Local Ollama unavailable; using existing insight: {error}")

        insight = generate_journal_insight(
            text,
            sentiment,
            emotion,
            mood_score,
            positive_moment
        )

        insight["ai_source"] = "existing_local_nlp_fallback"
        return insight

# ============================================================
# COMPLETE MOOD ANALYSIS
# ============================================================

def analyze_mood(text):

    if not text or not str(text).strip():

        return {
            "status": "error",
            "message": "Journal text cannot be empty."
        }

    sentiment_result = predict_sentiment(text)

    emotion_result = predict_emotion(text)

    sentiment = sentiment_result["sentiment"]

    emotion = emotion_result["emotion"]

    mood_score = calculate_mood_score(
        sentiment_result,
        emotion_result
    )

    positive_moment = extract_positive_moment(
        text
    )

    journal_insight = generate_local_ai_insight(
        text,
        sentiment,
        emotion,
        mood_score,
        positive_moment
    )

    supportive_message = get_supportive_message(
        sentiment,
        emotion,
        positive_moment,
        text
    )

    return {

        "status": "success",

        "sentiment": sentiment,

        "sentiment_confidence":
            sentiment_result["confidence"],

        "emotion": emotion,

        "emotion_confidence":
            emotion_result["confidence"],

        "mood_score": mood_score,

        "positive_moment":
            positive_moment,

        "journal_insight":
            journal_insight,

        "supportive_message":
            supportive_message

    }


# ============================================================
# INITIALIZE MODELS
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("MINDNUTRI MOOD NLP ENGINE")
    print("=" * 60)

    print("\nSentiment model saved:")
    print(SENTIMENT_MODEL_PATH)

    print("\nEmotion model saved:")
    print(EMOTION_MODEL_PATH)

    print("\nVectorizer saved:")
    print(VECTORIZER_MODEL_PATH)

    print("\nTesting engine...")

    test_text = (
        "Today I completed my project and I feel "
        "very happy and proud."
    )

    result = analyze_mood(
        test_text
    )

    print("\nTest Result:")
    print(result)

    print("\nMood engine initialized successfully!")