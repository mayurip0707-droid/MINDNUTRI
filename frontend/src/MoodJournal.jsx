import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";
import "./MoodJournal.css";

// ============================================================
// MINDNUTRI - MOOD JOURNAL
// Local Flask NLP Backend
// ============================================================

const MOOD_HISTORY_KEY = "mindnutri_mood_history";

function MoodJournal() {
  const navigate = useNavigate();

  const [journalText, setJournalText] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // MOOD OPTIONS
  // ============================================================

  const moodOptions = [
    {
      label: "Very Happy",
      emoji: "😄",
      value: "very-happy",
    },
    {
      label: "Happy",
      emoji: "😊",
      value: "happy",
    },
    {
      label: "Calm",
      emoji: "😌",
      value: "calm",
    },
    {
      label: "Okay",
      emoji: "🙂",
      value: "okay",
    },
    {
      label: "Sad",
      emoji: "😔",
      value: "sad",
    },
    {
      label: "Stressed",
      emoji: "😣",
      value: "stressed",
    },
    {
      label: "Angry",
      emoji: "😠",
      value: "angry",
    },
    {
      label: "Anxious",
      emoji: "😟",
      value: "anxious",
    },
  ];

  // ============================================================
  // LOAD JOURNAL HISTORY
  // ============================================================

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(
        MOOD_HISTORY_KEY
      );

      if (!savedHistory) return;

      const parsedHistory = JSON.parse(savedHistory);

      if (Array.isArray(parsedHistory)) {
        setHistory(parsedHistory);
      }
    } catch (err) {
      console.error(
        "Unable to load mood journal history:",
        err
      );
    }
  }, []);

  // ============================================================
  // SAVE HISTORY
  // ============================================================

  const saveHistory = (newHistory) => {
    try {
      localStorage.setItem(
        MOOD_HISTORY_KEY,
        JSON.stringify(newHistory)
      );

      setHistory(newHistory);
    } catch (err) {
      console.error(
        "Unable to save mood history:",
        err
      );

      setError(
        "Unable to save journal history on this device."
      );
    }
  };

  // ============================================================
  // SENTIMENT CLASS
  // ============================================================

  const getSentimentClass = (sentiment) => {
    const value = String(
      sentiment || ""
    ).toLowerCase();

    if (value === "positive") {
      return "sentiment-positive";
    }

    if (value === "negative") {
      return "sentiment-negative";
    }

    return "sentiment-neutral";
  };

  // ============================================================
  // EMOTION EMOJI
  // ============================================================

  const getEmotionEmoji = (emotion) => {
    const value = String(
      emotion || ""
    ).toLowerCase();

    const emojis = {
      happiness: "😊",
      happy: "😊",
      joy: "😄",
      excitement: "🤩",

      sadness: "😔",
      sad: "😔",

      stress: "😣",
      stressed: "😣",
      overwhelm: "😵‍💫",
      overwhelmed: "😵‍💫",
      tired: "😴",

      anger: "😠",
      angry: "😠",

      calm: "😌",
      peace: "🌿",

      fear: "😟",
      anxious: "😟",
      anxiety: "😟",

      neutral: "🙂",
    };

    return emojis[value] || "🧠";
  };

  // ============================================================
  // MOOD SCORE MESSAGE
  // ============================================================

  const getMoodScoreMessage = (score) => {
    const numericScore = Number(score);

    if (numericScore >= 80) {
      return "Your mood appears quite positive today. Keep noticing the little things that make you feel good.";
    }

    if (numericScore >= 60) {
      return "Your mood appears fairly balanced today. A few small positive actions can make the rest of your day even better.";
    }

    if (numericScore >= 40) {
      return "Your day may have some emotional ups and downs. Be kind to yourself and focus on one manageable thing at a time.";
    }

    return "Today seems emotionally difficult. You do not have to fix everything at once. Take one small step and give yourself time.";
  };

  // ============================================================
  // PERSONALIZED SUPPORT
  // ============================================================

  const getSupportiveMessage = (
    emotion,
    sentiment,
    score
  ) => {
    const emotionValue = String(
      emotion || ""
    ).toLowerCase();

    const sentimentValue = String(
      sentiment || ""
    ).toLowerCase();

    const numericScore = Number(score);

    if (
      emotionValue.includes("stress") ||
      emotionValue.includes("overwhelm") ||
      emotionValue.includes("tired")
    ) {
      return "It sounds like today has been a little overwhelming. You do not have to handle everything at once. Take a breath, slow down, and focus on one small thing at a time. You are doing better than you think. 💚";
    }

    if (
      emotionValue.includes("sad") ||
      emotionValue.includes("sadness")
    ) {
      return "It is okay to have difficult days. Your feelings are valid, and one hard day does not define you. Be gentle with yourself and remember that better moments can come again. 🌱";
    }

    if (
      emotionValue.includes("anxious") ||
      emotionValue.includes("anxiety") ||
      emotionValue.includes("fear")
    ) {
      return "You may be feeling a little uncertain right now. You do not have to solve everything today. Take a slow breath, stay in the present moment, and take things one step at a time. 🌿";
    }

    if (
      emotionValue.includes("anger") ||
      emotionValue.includes("angry")
    ) {
      return "It sounds like something really bothered you today. Give yourself a little space before reacting. Take a breath, allow yourself to calm down, and remember that you can choose how you respond. 🌸";
    }

    if (
      sentimentValue === "negative" ||
      numericScore < 40
    ) {
      return "Today may have felt difficult, but one difficult day does not define you. Be patient with yourself, take things slowly, and remember that tomorrow gives you another chance to begin again. 💚";
    }

    if (
      numericScore >= 80 ||
      emotionValue.includes("happy") ||
      emotionValue.includes("happiness") ||
      emotionValue.includes("joy")
    ) {
      return "You seem to have had a positive day! Take a moment to appreciate this feeling and carry this positive energy into tomorrow. Keep going — you are doing well! 🌟";
    }

    if (
      emotionValue.includes("calm") ||
      emotionValue.includes("peace")
    ) {
      return "You seem to have found a peaceful moment today. Appreciate it, protect that feeling, and carry a little of this calmness into the rest of your day. 🌿";
    }

    if (numericScore < 60) {
      return "Your day may have had some ups and downs. That is completely okay. Focus on the small things you can control and give yourself credit for getting through today. 🌱";
    }

    return "Keep checking in with yourself and celebrate the small moments that make your day better. Every positive step matters. ✨";
  };

  // ============================================================
  // ONE SMALL STEP
  // ============================================================

  const getOneSmallStep = (emotion, score) => {
    const emotionValue = String(
      emotion || ""
    ).toLowerCase();

    const numericScore = Number(score);

    if (
      emotionValue.includes("stress") ||
      emotionValue.includes("overwhelm")
    ) {
      return "Take 5 slow breaths, drink some water, and give yourself a short break.";
    }

    if (
      emotionValue.includes("sad") ||
      emotionValue.includes("sadness")
    ) {
      return "Do one small thing that usually brings you comfort, such as listening to music or talking to someone you trust.";
    }

    if (
      emotionValue.includes("anxious") ||
      emotionValue.includes("anxiety") ||
      emotionValue.includes("fear")
    ) {
      return "Pause for a moment and take 5 slow breaths. Focus only on what you can control right now.";
    }

    if (
      emotionValue.includes("anger") ||
      emotionValue.includes("angry")
    ) {
      return "Give yourself a few quiet minutes before responding to anything that is frustrating you.";
    }

    if (numericScore >= 80) {
      return "Write down one thing that made you happy today so you can remember this positive moment.";
    }

    if (emotionValue.includes("calm")) {
      return "Take a few minutes to enjoy this peaceful feeling without rushing to the next task.";
    }

    return "Choose one small task you can complete today and give yourself credit when you finish it.";
  };

  // ============================================================
  // POSITIVE MOTIVATION
  // ============================================================

  const getPositiveMotivation = (
    emotion,
    sentiment,
    score
  ) => {
    const emotionValue = String(
      emotion || ""
    ).toLowerCase();

    const sentimentValue = String(
      sentiment || ""
    ).toLowerCase();

    const numericScore = Number(score);

    if (
      emotionValue.includes("stress") ||
      emotionValue.includes("overwhelm")
    ) {
      return {
        title: "You can take it one step at a time 💚",
        message:
          "You do not need to have everything figured out right now. Pause, breathe, and choose just one thing to focus on. Small progress is still progress.",
      };
    }

    if (
      emotionValue.includes("sad") ||
      emotionValue.includes("sadness")
    ) {
      return {
        title: "A difficult moment is not your whole story 🌱",
        message:
          "You are allowed to have a bad day. Give yourself the same kindness you would give someone you care about. Tomorrow can bring a new moment.",
      };
    }

    if (
      emotionValue.includes("anxious") ||
      emotionValue.includes("anxiety") ||
      emotionValue.includes("fear")
    ) {
      return {
        title: "Come back to this moment 🌿",
        message:
          "You do not have to solve tomorrow today. Focus on what is happening right now and take the next small step you can manage.",
      };
    }

    if (
      emotionValue.includes("anger") ||
      emotionValue.includes("angry")
    ) {
      return {
        title: "You have more control than you think 🌸",
        message:
          "Give yourself a moment before reacting. A calm response can change the direction of an entire situation.",
      };
    }

    if (
      numericScore >= 80 ||
      sentimentValue === "positive"
    ) {
      return {
        title: "Keep that positive energy going! 🌟",
        message:
          "Notice what made today better. These small positive moments can become habits that support your overall wellness.",
      };
    }

    return {
      title: "You showed up for yourself today ✨",
      message:
        "Taking a moment to understand your feelings is already a positive step. Keep going, one small step at a time.",
    };
  };

  // ============================================================
  // ANALYZE JOURNAL
  // ============================================================

  const handleAnalyze = async () => {
    setError("");

    const trimmedText = journalText.trim();

    if (!trimmedText) {
      setError(
        "Please write something about your day before analyzing."
      );
      return;
    }

    if (trimmedText.length < 10) {
      setError(
        "Please write at least a few words so the wellness engine can analyze your journal."
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const endpoint = `${API_BASE_URL}/analyze-mood`;

      console.log(
        "Sending mood analysis request to:",
        endpoint
      );

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          text: trimmedText,
          selected_mood: selectedMood,
        }),
      });

      console.log(
        "Mood API HTTP Status:",
        response.status
      );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "Invalid JSON response:",
          jsonError
        );

        throw new Error(
          "The backend returned an invalid response."
        );
      }

      console.log(
        "Mood Analysis Response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Mood analysis failed with status ${response.status}.`
        );
      }

      if (!data) {
        throw new Error(
          "No response received from the backend."
        );
      }

      if (data.status === "error") {
        throw new Error(
          data.message ||
            "The local mood engine could not analyze the journal."
        );
      }

      // ========================================================
      // CREATE RESULT
      // ========================================================

      const moodResult = {
        id: Date.now(),

        text: trimmedText,

        selectedMood:
          selectedMood || "Not selected",

        sentiment:
          data.sentiment || "neutral",

        sentimentConfidence: Number(
          data.sentiment_confidence ?? 0
        ),

        emotion:
          data.emotion || "neutral",

        emotionConfidence: Number(
          data.emotion_confidence ?? 0
        ),

        moodScore: Math.min(
          Math.max(
            Number(data.mood_score ?? 0),
            0
          ),
          100
        ),

        positiveMoment:
          data.positive_moment || null,

        journalInsight:
          data.journal_insight ||
          "Your journal was analyzed using the local wellness engine.",

        supportiveMessage:
          data.supportive_message ||
          "Thank you for checking in with yourself today.",

        date:
          new Date().toLocaleDateString(),

        timestamp:
          new Date().toISOString(),
      };

      console.log(
        "Final Mood Result:",
        moodResult
      );

      setResult(moodResult);

      const updatedHistory = [
        moodResult,
        ...history,
      ].slice(0, 20);

      saveHistory(updatedHistory);

      setJournalText("");
      setSelectedMood("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Mood Journal Error:",
        err
      );

      if (
        err instanceof TypeError &&
        err.message
          .toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Unable to connect to the MindNutri backend. Please make sure Flask is running on http://127.0.0.1:5000."
        );
      } else {
        setError(
          err.message ||
            "Unable to analyze your journal."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE ENTRY
  // ============================================================

  const deleteEntry = (id) => {
    const updatedHistory =
      history.filter(
        (entry) => entry.id !== id
      );

    saveHistory(updatedHistory);

    if (
      result &&
      result.id === id
    ) {
      setResult(null);
    }
  };

  // ============================================================
  // CLEAR HISTORY
  // ============================================================

  const clearHistory = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your mood journal history?"
    );

    if (!confirmed) return;

    localStorage.removeItem(
      MOOD_HISTORY_KEY
    );

    setHistory([]);
    setResult(null);
    setError("");
  };

  // ============================================================
  // RESULT VIEW
  // ============================================================

  if (result) {
    const motivation =
      getPositiveMotivation(
        result.emotion,
        result.sentiment,
        result.moodScore
      );

    const smallStep =
      getOneSmallStep(
        result.emotion,
        result.moodScore
      );

    return (
      <div className="mood-page">
        <div className="mood-result-container">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mood-result-header">
            <div>
              <p className="mood-eyebrow">
                MINDNUTRI • MOOD JOURNAL
              </p>

              <h1>
                Your Mood Analysis 💭
              </h1>

              <p>
                Your journal was analyzed using
                the MindNutri local NLP wellness
                engine.
              </p>
            </div>

          </div>

          {/* ==================================================
              MAIN RESULT
          ================================================== */}

          <section
            className={`mood-main-card ${getSentimentClass(
              result.sentiment
            )}`}
          >
            <div className="mood-score-circle">
              <strong>
                {result.moodScore}
              </strong>

              <span>
                Mood Score
              </span>

              <small>
                / 100
              </small>
            </div>

            <div className="mood-result-info">
              <p className="mood-result-label">
                YOUR CURRENT MOOD PATTERN
              </p>

              <h2>
                {getEmotionEmoji(
                  result.emotion
                )}{" "}
                {result.emotion}
              </h2>

              <div className="mood-result-tags">
                <span>
                  Sentiment:{" "}
                  <strong>
                    {result.sentiment}
                  </strong>
                </span>

                <span>
                  Confidence:{" "}
                  <strong>
                    {result.sentimentConfidence}%
                  </strong>
                </span>

                <span>
                  Emotion Confidence:{" "}
                  <strong>
                    {result.emotionConfidence}%
                  </strong>
                </span>
              </div>

              <p className="mood-score-message">
                {getMoodScoreMessage(
                  result.moodScore
                )}
              </p>

              <p className="mood-date">
                Journal analyzed on{" "}
                {result.date}
              </p>
            </div>
          </section>

          {/* ==================================================
              JOURNAL ENTRY
          ================================================== */}

          <section className="mood-analysis-card">
            <div className="mood-card-heading">
              <span>📝</span>

              <div>
                <h2>
                  Your Journal Entry
                </h2>

                <p>
                  The text you shared with
                  the MindNutri wellness engine.
                </p>
              </div>
            </div>

            <div className="journal-entry-display">
              "{result.text}"
            </div>
          </section>

          {/* ==================================================
              EMOTIONAL INSIGHTS
          ================================================== */}

          <section className="mood-analysis-card">
            <div className="mood-card-heading">
              <span>🔍</span>

              <div>
                <h2>
                  Emotional Insights
                </h2>

                <p>
                  Key patterns identified
                  from your journal.
                </p>
              </div>
            </div>

            <div className="mood-factor-grid">

              {/* SENTIMENT */}

              <div className="mood-factor">
                <span>😊</span>

                <div>
                  <strong>
                    Sentiment
                  </strong>

                  <p>
                    {result.sentiment}
                  </p>

                  <small>
                    {result.sentimentConfidence}%
                    confidence
                  </small>
                </div>
              </div>

              {/* EMOTION */}

              <div className="mood-factor">
                <span>
                  {getEmotionEmoji(
                    result.emotion
                  )}
                </span>

                <div>
                  <strong>
                    Emotion
                  </strong>

                  <p>
                    {result.emotion}
                  </p>

                  <small>
                    {result.emotionConfidence}%
                    confidence
                  </small>
                </div>
              </div>

              {/* MOOD SCORE */}

              <div className="mood-factor">
                <span>💯</span>

                <div>
                  <strong>
                    Mood Score
                  </strong>

                  <p>
                    {result.moodScore}/100
                  </p>
                </div>
              </div>

              {/* SELECTED MOOD */}

              <div className="mood-factor">
                <span>🎯</span>

                <div>
                  <strong>
                    Selected Mood
                  </strong>

                  <p>
                    {result.selectedMood}
                  </p>
                </div>
              </div>

              {/* DATE */}

              <div className="mood-factor">
                <span>📅</span>

                <div>
                  <strong>
                    Journal Date
                  </strong>

                  <p>
                    {result.date}
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ==================================================
              POSITIVE MOMENT
          ================================================== */}

          {result.positiveMoment && (
            <section className="positive-moment-card">
              <div className="positive-moment-icon">
                ✨
              </div>

              <div>
                <p className="mood-eyebrow">
                  POSITIVE MOMENT
                </p>

                <h2>
                  Something good from your day
                </h2>

                <p>
                  {result.positiveMoment}
                </p>
              </div>
            </section>
          )}

          {/* ==================================================
              JOURNAL-BASED INSIGHT
          ================================================== */}

          <section className="mood-analysis-card">
            <div className="mood-card-heading">
              <span>🔎</span>

              <div>
                <h2>
                  What Your Journal Reveals
                </h2>

                <p>
                  A personalized insight generated from your
                  actual journal text.
                </p>
              </div>
            </div>

            <div className="journal-insight-content">
              <p>
                {result.journalInsight?.insight}
              </p>
            </div>
          </section>

          {/* ==================================================
              SUPPORT MESSAGE
          ================================================== */}

          <section className="support-message-card">
            <div className="support-message-icon">
              🌿
            </div>

            <div>
              <p className="mood-eyebrow">
                A LITTLE SUPPORT FOR YOU
              </p>

              <h2>
                MindNutri Insight
              </h2>

              <p>
                {getSupportiveMessage(
                  result.emotion,
                  result.sentiment,
                  result.moodScore
                )}
              </p>
            </div>
          </section>

          {/* ==================================================
              NEW: POSITIVE MOTIVATION
          ================================================== */}

          <section className="positive-motivation-card">

            <div>
              <p className="mood-eyebrow">
                YOUR POSITIVE REMINDER
              </p>

              <h2>
                {motivation.title}
              </h2>

              <p>
                {motivation.message}
              </p>
            </div>
          </section>

          {/* ==================================================
              NEW: ONE SMALL STEP
          ================================================== */}

          <section className="small-step-card">
            <div className="small-step-icon">
              🌱
            </div>

            <div>
              <p className="mood-eyebrow">
                ONE SMALL STEP FOR TODAY
              </p>

              <h2>
                Keep it simple 🎯
              </h2>

              <p>
                {smallStep}
              </p>
            </div>
          </section>

          {/* ==================================================
              DAILY ENCOURAGEMENT
          ================================================== */}

          <section className="daily-encouragement-card">

            <h2>
              Remember this 💫
            </h2>

            <p>
              You do not need a perfect day
              to have a meaningful one.
              Every time you pause, reflect,
              and take care of yourself,
              you are making progress.
            </p>

            <strong>
              One small positive step is enough for today. 🌷
            </strong>
          </section>

          {/* ==================================================
              DISCLAIMER
          ================================================== */}

          <div className="mood-disclaimer">
            <span>⚠️</span>

            <p>
              MindNutri provides educational
              wellness insights based on journal
              text. Emotional analysis is an
              automated estimate and is not a
              medical or psychiatric diagnosis.
            </p>
          </div>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <div className="mood-actions">
            <button
              className="secondary-mood-btn"
              type="button"
              onClick={() => {
                setResult(null);
                setError("");
              }}
            >
              ✍ Write Another Entry
            </button>

            <button
              className="primary-mood-btn"
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ============================================================
  // JOURNAL SCREEN
  // ============================================================

  return (
    <div className="mood-page">
      <div className="mood-container">

        {/* HEADER */}

        <div className="mood-header">
          <div>
            <p className="mood-eyebrow">
              MINDNUTRI • MENTAL WELLNESS
            </p>

            <h1>
              Mood Journal 💭
            </h1>

            <p>
              Take a moment to reflect on your
              day. Write freely and let MindNutri
              help you understand your emotional
              patterns.
            </p>
          </div>

          <div className="mood-header-icon">
            💭
          </div>
        </div>

        {/* JOURNAL CARD */}

        <section className="journal-card">

          {/* CARD HEADING */}

          <div className="journal-card-heading">
            <div className="journal-icon">
              📝
            </div>

            <div>
              <h2>
                How are you feeling today?
              </h2>

              <p>
                There are no right or wrong
                answers. Write honestly about
                your day.
              </p>
            </div>
          </div>

          {/* MOOD SELECTOR */}

          <div className="mood-selector">
            <h3>
              Choose your current mood
            </h3>

            <div className="mood-options">
              {moodOptions.map((mood) => (
                <button
                  type="button"
                  key={mood.value}
                  className={
                    selectedMood === mood.value
                      ? "mood-option selected"
                      : "mood-option"
                  }
                  onClick={() => {
                    setSelectedMood(
                      mood.value
                    );
                    setError("");
                  }}
                  disabled={loading}
                >
                  <span>
                    {mood.emoji}
                  </span>

                  <small>
                    {mood.label}
                  </small>
                </button>
              ))}
            </div>
          </div>

          {/* TEXT AREA */}

          <div className="journal-input-section">

            <div className="journal-input-header">
              <label htmlFor="journalText">
                Write about your day
              </label>

              <span>
                {journalText.length} characters
              </span>
            </div>

            <textarea
              id="journalText"
              value={journalText}
              onChange={(e) => {
                setJournalText(
                  e.target.value
                );
                setError("");
              }}
              placeholder="Example: Today I completed my project and felt really proud. I was a little stressed in the morning, but spending time with my friends made me feel much better..."
              rows={10}
              maxLength={3000}
              disabled={loading}
            />

            <div className="journal-input-footer">
              <span>
                💡 Tip: Write about what happened,
                how you felt, and what made your
                day better or difficult.
              </span>

              <span>
                {journalText.length}/3000
              </span>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="mood-error"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          {/* SUBMIT */}

          <div className="journal-submit-area">
            <div>
              <strong>
                🔒 Your journal stays on your device
              </strong>

              <p>
                MindNutri sends the text only to
                your local Flask wellness engine
                running on your computer.
              </p>
            </div>

            <button
              type="button"
              className="analyze-mood-btn"
              onClick={handleAnalyze}
              disabled={
                loading ||
                !journalText.trim()
              }
            >
              {loading ? (
                <>
                  ⏳ Analyzing...
                </>
              ) : (
                <>
                  Analyze My Mood →
                </>
              )}
            </button>
          </div>

        </section>

        {/* HISTORY */}

        {history.length > 0 && (
          <section className="history-section">

            <div className="history-heading">
              <div>
                <p className="mood-eyebrow">
                  YOUR JOURNAL HISTORY
                </p>

                <h2>
                  Previous Mood Entries
                </h2>

                <p>
                  Review your recent emotional
                  wellness check-ins.
                </p>
              </div>

              <button
                type="button"
                className="clear-history-btn"
                onClick={clearHistory}
              >
                Clear History
              </button>
            </div>

            <div className="history-grid">
              {history.map((entry) => (
                <div
                  className="history-card"
                  key={entry.id}
                >
                  <div className="history-card-top">

                    <span>
                      {getEmotionEmoji(
                        entry.emotion
                      )}
                    </span>

                    <div>
                      <strong>
                        {entry.emotion}
                      </strong>

                      <small>
                        {entry.date}
                      </small>
                    </div>

                    <div className="history-score">
                      {entry.moodScore}
                    </div>
                  </div>

                  <p>
                    {entry.text.length > 150
                      ? `${entry.text.substring(
                          0,
                          150
                        )}...`
                      : entry.text}
                  </p>

                  <div className="history-card-bottom">

                    <span
                      className={getSentimentClass(
                        entry.sentiment
                      )}
                    >
                      {entry.sentiment}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        deleteEntry(
                          entry.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {/* FOOTER DISCLAIMER */}

        <div className="mood-footer-disclaimer">
          <span>ⓘ</span>

          <p>
            MindNutri's Mood Journal provides
            educational emotional wellness
            insights. It does not diagnose mental
            health conditions or replace
            professional care.
          </p>
        </div>

        {/* BACK BUTTON */}

        <div className="back-dashboard-area">
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

export default MoodJournal;