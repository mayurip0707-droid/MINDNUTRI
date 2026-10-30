import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StressAssessment.css";
import { API_BASE_URL } from "../api";

const getStressContextAnalysis = (assessment = {}) => {
  const insights = [];

  const workloadInsights = {
    "Very Light": "You report a very light workload.",
    Manageable: "You feel your workload is manageable.",
    Heavy: "You report a heavy workload, which may be a source of stress.",
    Overwhelming:
      "You report an overwhelming workload. Consider prioritising tasks and taking short breaks.",
  };

  const pressureInsights = {
    None: "You report no exam or deadline pressure.",
    Mild: "You report mild exam or deadline pressure.",
    Moderate: "You report moderate exam or deadline pressure.",
    High: "You report high exam or deadline pressure.",
    "Very High":
      "You report very high exam or deadline pressure. Breaking tasks into smaller steps may help.",
  };

  const responsibilityInsights = {
    "Very Light": "You report very light daily responsibilities.",
    Manageable: "You feel your daily responsibilities are manageable.",
    Demanding: "You report demanding daily responsibilities.",
    Overwhelming:
      "You report overwhelming daily responsibilities. Consider identifying which tasks can be prioritised or shared.",
    "Not Applicable": "You report that daily responsibilities are not applicable.",
  };

  if (workloadInsights[assessment.workload]) {
    insights.push(workloadInsights[assessment.workload]);
  }

  if (pressureInsights[assessment.pressureType]) {
    insights.push(pressureInsights[assessment.pressureType]);
  }

  if (responsibilityInsights[assessment.dailyResponsibilities]) {
    insights.push(responsibilityInsights[assessment.dailyResponsibilities]);
  }

  const reasons = assessment.stressReasons || [];

  if (
    reasons.length &&
    !reasons.includes("Not Sure") &&
    !reasons.includes("Prefer Not to Say")
  ) {
    const selectedReasons = [
      ...reasons.filter((reason) => reason !== "Other"),
      ...(reasons.includes("Other") && assessment.otherStressReason?.trim()
        ? [assessment.otherStressReason.trim()]
        : []),
    ];

    if (selectedReasons.length) {
      insights.push(
        `You identified these possible stress contributors: ${selectedReasons.join(", ")}.`
      );
    }
  } else if (reasons.includes("Not Sure")) {
    insights.push(
      "You are unsure about the specific sources of stress. Tracking your mood and daily experiences may help you notice patterns."
    );
  }

  return insights;
};

const getStressContextSummary = (assessment = {}) => {
  const concerns = [];

  if (assessment.workload === "Heavy") {
    concerns.push("a heavy workload");
  } else if (assessment.workload === "Overwhelming") {
    concerns.push("an overwhelming workload");
  }

  if (
    assessment.pressureType === "High" ||
    assessment.pressureType === "Very High"
  ) {
    concerns.push("high exam or deadline pressure");
  } else if (assessment.pressureType === "Moderate") {
    concerns.push("moderate exam or deadline pressure");
  }

  if (assessment.dailyResponsibilities === "Demanding") {
    concerns.push("demanding daily responsibilities");
  } else if (assessment.dailyResponsibilities === "Overwhelming") {
    concerns.push("overwhelming daily responsibilities");
  }

  const reasons = assessment.stressReasons || [];
  const selectedReasons = [
    ...reasons.filter(
      (reason) =>
        reason !== "Other" &&
        reason !== "Not Sure" &&
        reason !== "Prefer Not to Say"
    ),
    ...(reasons.includes("Other") && assessment.otherStressReason?.trim()
      ? [assessment.otherStressReason.trim()]
      : []),
  ];

  if (concerns.length > 0) {
    let summary = `Your responses indicate ${concerns.join(" and ")}`;

    if (selectedReasons.length > 0) {
      summary += `. You identified ${selectedReasons.join(", ")} as possible stress contributors`;
    }

    return (
      summary +
      ". Consider prioritising tasks, breaking larger tasks into smaller steps, and taking regular breaks."
    );
  }

  if (selectedReasons.length > 0) {
    return `You identified ${selectedReasons.join(", ")} as possible stress contributors. Continue monitoring your daily experiences to understand what affects your wellbeing.`;
  }

  return "Your answers do not indicate a specific workload or pressure concern. Continue tracking your daily experiences to understand your stress patterns.";
};

function StressAssessment() {
  const navigate = useNavigate();

  // ================= FORM STATE =================

  
  const [form, setForm] = useState({
    sleepDuration: "",
    sleepQuality: "",
    activityLevel: "",
    stressFeeling: "",
    occupation: "",

    // New stress-context fields
    workload: "",
    pressureType: "",
    dailyResponsibilities: "",
    stressReasons: [],
    otherStressReason: "",


    heartRateKnown: "",
    heartRate: "",
  });


  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FORM CHANGE =================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SLEEP DURATION =================

  const getSleepDuration = () => {
    const values = {
      "Less than 5 hours": 4.5,
      "5–6 hours": 5.5,
      "6–7 hours": 6.5,
      "7–8 hours": 7.5,
      "More than 8 hours": 8.5,
    };

    return values[form.sleepDuration] || 6.5;
  };

  // ================= SLEEP QUALITY =================

  const getSleepQuality = () => {
    const values = {
      "Very Poor": 3,
      Poor: 4,
      Average: 5,
      Good: 7,
      Excellent: 9,
    };

    return values[form.sleepQuality] || 5;
  };

  // ================= ACTIVITY LEVEL =================

  const getActivityLevel = () => {
    const values = {
      "Mostly Sitting": 20,
      "Lightly Active": 35,
      "Moderately Active": 50,
      "Very Active": 70,
    };

    return values[form.activityLevel] || 35;
  };

  // ================= STRESS FEELING =================

  const getStressFeeling = () => {
    const values = {
      "Very Relaxed": 3,
      "Mostly Calm": 4,
      "Moderately Stressed": 6,
      "Highly Stressed": 8,
      "Extremely Stressed": 9,
    };

    return values[form.stressFeeling] || 5;
  };

  // ================= DAILY STEPS =================

  const getDailySteps = () => {
    const values = {
      "Mostly Sitting": 3000,
      "Lightly Active": 5000,
      "Moderately Active": 7000,
      "Very Active": 9000,
    };

    return values[form.activityLevel] || 5000;
  };

  // ============================================================
  // SUBMIT ASSESSMENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ================= REQUIRED FIELD VALIDATION =================

    if (
      !form.sleepDuration ||
      !form.sleepQuality ||
      !form.activityLevel ||
      !form.stressFeeling ||
      !form.occupation ||
      !form.workload ||
      !form.pressureType ||
      !form.dailyResponsibilities ||
      !form.stressReasons.length
    ) {
      setError(
        "Please answer all required questions, including your workload, pressure, daily responsibilities and stress reasons."
      );
      return;
    }

    // ================= HEART RATE VALIDATION =================

    if (
      form.heartRateKnown === "yes" &&
      (!form.heartRate ||
        Number(form.heartRate) < 30 ||
        Number(form.heartRate) > 220)
    ) {
      setError(
        "Please enter a valid heart rate between 30 and 220 BPM."
      );
      return;
    }

    setLoading(true);

    try {
      // ================= USER STRESS SCORE =================

      const stressFeelingScore = getStressFeeling();

      // ================= ML MODEL PAYLOAD =================

      const payload = {
        Gender: "Female",
        Age: 22,
        Occupation: form.occupation,

        "Sleep Duration": getSleepDuration(),

        "Quality of Sleep": getSleepQuality(),

        "Physical Activity Level": getActivityLevel(),

        "Stress Feeling": stressFeelingScore,

        "Workload": form.workload,

        "Pressure Type": form.pressureType,

        "Daily Responsibilities": form.dailyResponsibilities,

        "Stress Reasons": form.stressReasons,

        "Other Stress Reason": form.stressReasons.includes("Other")
          ? form.otherStressReason.trim()
          : "",


        "BMI Category": "Normal",

        "Heart Rate":
          form.heartRateKnown === "yes"
            ? Number(form.heartRate)
            : 72,

        "Daily Steps": getDailySteps(),

        "Systolic BP": 120,

        "Diastolic BP": 80,
      };

      console.log(
        "Sending Stress Assessment Payload:",
        payload
      );

      // ============================================================
      // BACKEND REQUEST
      // ============================================================

      const response = await fetch(
        `${API_BASE_URL}/predict-stress`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log(
        "Stress Prediction Response:",
        data
      );

      // ================= BACKEND ERROR =================

      if (!response.ok || data.status === "error") {
        throw new Error(
          data.message ||
            "Unable to generate stress prediction."
        );
      }

      // ============================================================
      // CREATE FINAL STRESS RESULT
      // ============================================================

      const stressResult = {
        prediction: data.prediction || "Moderate",

        confidence:
          data.confidence !== undefined &&
          data.confidence !== null
            ? Number(data.confidence)
            : 0,

        stressScore:
          data.stress_score !== undefined &&
          data.stress_score !== null &&
          Number.isFinite(Number(data.stress_score))
            ? Number(data.stress_score)
            : 5.0,

        reportedStressScore: data.reported_stress_score,

        date: new Date().toLocaleDateString(),

        timestamp: new Date().toISOString(),

        // ================= ASSESSMENT DETAILS =================
        
        assessment: {
          sleepDuration: form.sleepDuration,
          sleepQuality: form.sleepQuality,
          activityLevel: form.activityLevel,
          stressFeeling: form.stressFeeling,
          occupation: form.occupation,
          workload: form.workload,
          pressureType: form.pressureType,
          dailyResponsibilities: form.dailyResponsibilities,
          stressReasons: form.stressReasons,
          otherStressReason: form.stressReasons.includes("Other")
            ? form.otherStressReason.trim()
            : "",
          heartRate: form.heartRateKnown === "yes" ? form.heartRate : null,
        },

      };

      console.log("Final Stress Result:", stressResult);

      // ============================================================
      // SAVE LATEST RESULT
      // ============================================================

      localStorage.setItem(
        "mindnutri_stress_result",
        JSON.stringify(stressResult)
      );

      // ============================================================
      // SAVE STRESS HISTORY
      // ============================================================

      const existingStressHistory = JSON.parse(
        localStorage.getItem("mindnutri_stress_history") || "[]"
      );
  
      const newStressEntry = {
        stressScore: Number(stressResult.stressScore || 0),
        prediction: stressResult.prediction || "Unknown",
        confidence: Number(stressResult.confidence || 0),
        date: stressResult.date || new Date().toLocaleDateString("en-GB"),
        timestamp: stressResult.timestamp || new Date().toISOString(),
        assessment: stressResult.assessment,
      };

      const alreadyExists = existingStressHistory.some(
        (entry) =>
          entry.timestamp === newStressEntry.timestamp
      );

      const updatedStressHistory = alreadyExists
        ? existingStressHistory
        : [...existingStressHistory, newStressEntry];

      localStorage.setItem(
        "mindnutri_stress_history",
        JSON.stringify(updatedStressHistory)
      );

      console.log(
        "Stress result successfully saved:",
        stressResult
      );

      console.log(
        "Stress history:",
        updatedStressHistory
      );

      // ============================================================
      // SHOW RESULT SCREEN
      // ============================================================

      setResult(stressResult);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Stress Assessment Error:",
        err
      );

      setError(
        "Unable to connect to the wellness engine. Please make sure the Flask backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESULT CLASS
  // ============================================================

  const getResultClass = () => {
    if (!result) return "";

    const prediction = String(
      result.prediction
    ).toLowerCase();

    if (prediction === "high") {
      return "result-high";
    }

    if (prediction === "low") {
      return "result-low";
    }

    return "result-moderate";
  };

  // ============================================================
  // RESULT EMOJI
  // ============================================================

  const getResultEmoji = () => {
    if (!result) return "🧠";

    const prediction = String(
      result.prediction
    ).toLowerCase();

    if (prediction === "high") {
      return "🔴";
    }

    if (prediction === "low") {
      return "🟢";
    }

    return "🟡";
  };

  // ============================================================
  // RESULT MESSAGE
  // ============================================================

  const getResultMessage = () => {
    if (!result) return "";

    const prediction = String(
      result.prediction
    ).toLowerCase();

    if (prediction === "high") {
      return "Your responses indicate a higher level of stress. Focus on rest, relaxation and healthy daily routines.";
    }

    if (prediction === "low") {
      return "Your responses indicate a relatively low stress pattern. Continue maintaining your healthy lifestyle habits.";
    }

    return "Your responses indicate a moderate level of stress. A few lifestyle improvements may help you feel more balanced.";
  };

  // ============================================================
  // RECOMMENDATIONS
  // ============================================================

  const getRecommendations = () => {
    if (!result) return [];

    const prediction = String(
      result.prediction
    ).toLowerCase();

    // ================= HIGH STRESS =================

    if (prediction === "high") {
      return [
        {
          icon: "🧘",
          title: "Practice Relaxation",
          text: "Try 5–10 minutes of slow breathing, meditation or quiet relaxation.",
        },

        {
          icon: "😴",
          title: "Prioritize Sleep",
          text: "Maintain a consistent sleep schedule and aim for sufficient rest.",
        },

        {
          icon: "🚶",
          title: "Add Gentle Movement",
          text: "Take short walks or movement breaks instead of staying seated for long periods.",
        },

        {
          icon: "📵",
          title: "Take Screen Breaks",
          text: "Step away from screens periodically, especially during stressful work or study sessions.",
        },
      ];
    }

    // ================= LOW STRESS =================

    if (prediction === "low") {
      return [
        {
          icon: "🌿",
          title: "Maintain Your Routine",
          text: "Continue the healthy habits that are helping you maintain a balanced lifestyle.",
        },

        {
          icon: "😴",
          title: "Protect Your Sleep",
          text: "Keep a consistent sleep and wake schedule whenever possible.",
        },

        {
          icon: "🏃",
          title: "Stay Active",
          text: "Continue regular physical activity and daily movement.",
        },

        {
          icon: "😊",
          title: "Stay Connected",
          text: "Spend time with supportive friends, family or activities you enjoy.",
        },
      ];
    }

    // ================= MODERATE STRESS =================

    return [
      {
        icon: "😴",
        title: "Improve Sleep Quality",
        text: "Try to maintain a regular sleep schedule and create a relaxing bedtime routine.",
      },

      {
        icon: "🏃",
        title: "Increase Daily Movement",
        text: "Add short walks or activity breaks throughout your day.",
      },

      {
        icon: "🧘",
        title: "Manage Daily Stress",
        text: "Use breathing exercises, meditation or short relaxation breaks.",
      },

      {
        icon: "💧",
        title: "Support Your Wellness",
        text: "Stay hydrated, eat balanced meals and avoid skipping regular breaks.",
      },
    ];
  };

  // ============================================================
  // RESULT SCREEN
  // ============================================================

  if (result) {
    return (
      <div className="stress-page">

        <div className="result-container">

          {/* RESULT HEADER */}

          <div className="result-top">

            <div>

              <p className="stress-eyebrow">
                MINDNUTRI • PERSONALIZED WELLNESS
              </p>

              <h1>
                Your Stress Analysis
              </h1>

              <p>
                Your responses were analyzed using the
                MindNutri Machine Learning wellness engine.
              </p>

            </div>

          </div>

          {/* MAIN RESULT */}

          <section
            className={`main-result-card ${getResultClass()}`}
          >

            <div className="score-circle">

              <strong>
                {result.stressScore}
              </strong>

              <span>
                Stress Score
              </span>

              <small>
                / 10
              </small>

            </div>

            <div className="result-info">

              <p className="result-label">
                CURRENT STRESS PATTERN
              </p>

              <h2>
                {getResultEmoji()}{" "}
                {result.prediction} Stress
              </h2>

              <p className="result-message">
                {getResultMessage()}
              </p>

              {/* CONFIDENCE */}

              <div className="confidence-section">

                <div className="confidence-header">

                  <span>
                    Model Confidence
                  </span>

                  <strong>
                    {result.confidence}%
                  </strong>

                </div>

                <div className="confidence-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(result.confidence) || 0,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              {/* DATE */}

              <p className="result-date">
                Assessment completed on{" "}
                {result.date}
              </p>

            </div>

          </section>

          {/* WHY RESULT */}

          <section className="analysis-card">

            <div className="analysis-title">

              <span>
                🔍
              </span>

              <div>

                <h2>
                  Why did you get this result?
                </h2>

                <p>
                  
                  {String(result.prediction || "").toLowerCase().includes("high")
                    ? "The model classified your lifestyle inputs into its High Stress category. Review the factors below to understand the information provided."
                    : String(result.prediction || "").toLowerCase().includes("low")
                    ? "The model classified your lifestyle inputs into its Low Stress category. This does not rule out stress you may be experiencing personally."
                    : "The model classified your lifestyle inputs into its Moderate Stress category. Review the factors below and compare the estimate with how you feel."}

                </p>

              </div>

            </div>

            <div className="factor-grid">

              {/* SLEEP */}

              <div className="factor">

                <span>
                  😴
                </span>

                <div>

                  <strong>
                    Sleep
                  </strong>

                  <p>
                    {form.sleepDuration}
                  </p>

                </div>

              </div>

              {/* SLEEP QUALITY */}

              <div className="factor">

                <span>
                  🌙
                </span>

                <div>

                  <strong>
                    Sleep Quality
                  </strong>

                  <p>
                    {form.sleepQuality}
                  </p>

                </div>

              </div>

              {/* ACTIVITY */}

              <div className="factor">

                <span>
                  🏃
                </span>

                <div>

                  <strong>
                    Activity
                  </strong>

                  <p>
                    {form.activityLevel}
                  </p>

                </div>

              </div>

              {/* STRESS FEELING */}

              <div className="factor">

                <span>
                  🧠
                </span>

                <div>

                  <strong>
                    Stress Feeling
                  </strong>

                  <p>
                    {form.stressFeeling}
                  </p>

                </div>

              </div>

              {/* OCCUPATION */}

              <div className="factor">

                <span>
                  💼
                </span>

                <div>

                  <strong>
                    Daily Routine
                  </strong>

                  <p>
                    {form.occupation}
                  </p>

                </div>

              </div>

              {/* HEART RATE */}

              <div className="factor">

                <span>
                  ❤️
                </span>

                <div>

                  <strong>
                    Heart Rate
                  </strong>

                  <p>
                    {form.heartRateKnown === "yes"
                      ? `${form.heartRate} BPM`
                      : "Not provided"}
                  </p>

                </div>

              </div>

            </div>
            
            <div className="stress-explanation-card">

              <h3>📊 Understanding Your Stress Result</h3>

              <p>
                <strong>Model prediction:</strong> {result.prediction || "Not available"}
              </p>
 
              <p>
                <strong>Model confidence:</strong>{" "}
                {result.confidence !== undefined &&
                result.confidence !== null &&
                result.confidence !== "" &&
                Number.isFinite(Number(result.confidence))
                  ? `${Number(result.confidence).toFixed(2)}%`
                  : "Not available"}
              </p>

              <p>
                This percentage represents the model's confidence in its predicted category.
                It is not the probability that you personally have that level of stress.
              </p>

              <p>
                <strong>Sleep duration:</strong>{" "}
                {form.sleepDuration === "Less than 5 hours"
                  ? "Your reported sleep duration is short and may be relevant to your overall wellbeing."
                  : form.sleepDuration === "5–6 hours"
                  ? "You reported 5–6 hours of sleep. Consider whether you feel rested during the day."
                  : form.sleepDuration
                  ? `You reported ${form.sleepDuration}. Sleep duration alone cannot determine your stress level.`
                  : "No sleep duration provided."}
              </p>

              <p>
                <strong>Sleep quality:</strong>{" "}
                {["Very Poor", "Poor"].includes(form.sleepQuality)
                  ? "You reported poor sleep quality, which may affect how rested you feel."
                  : form.sleepQuality
                  ? `You rated your sleep quality as ${form.sleepQuality}. Good sleep does not necessarily mean you have low stress.`
                  : "No sleep quality provided."}
              </p>

              <p>
                <strong>Physical activity:</strong>{" "}
                {form.activityLevel === "Mostly Sitting"
                  ? "You reported mostly sitting during the day. This describes your activity pattern, not your mental stress by itself."
                  : form.activityLevel
                  ? `You reported being ${form.activityLevel.toLowerCase()}. Activity level is only one part of the overall assessment.`
                  : "No activity level provided."}
              </p>
            
              <p>
                <strong>Your reported stress:</strong>{" "}
                {form.stressFeeling
                  ? `You selected "${form.stressFeeling}". This records how stressed you feel personally.`
                  : "You did not provide a personal stress rating."}
                {" "}The current ML model predicts a category from its trained lifestyle
                inputs; it does not directly use your selected stress feeling, workload,
                pressure type, daily responsibilities, or reported stress reasons.
                Therefore, your personal experience and the model's prediction may differ.
              </p>
              
              <p>
                <strong>Other stress factors you reported:</strong>{" "}
                {form.stressReasons?.length
                  ? form.stressReasons.includes("Prefer Not to Say")
                    ? "You chose not to disclose your stress reasons."
                    : form.stressReasons.includes("Not Sure")
                    ? "You are unsure about the specific reasons for your stress."
                    : [
                        ...form.stressReasons.filter(
                          (reason) => reason !== "Other"
                        ),
                        ...(form.stressReasons.includes("Other") &&
                        form.otherStressReason?.trim()
                          ? [form.otherStressReason.trim()]
                          : []),
                      ].join(", ") || "No specific reason disclosed."
                  : "No specific reasons provided."}
              </p>
              
              <p>
                <strong>Workload:</strong>{" "}
                {form.workload || "Not provided"}. This describes how demanding your
                workload feels to you; it is not directly used by the current ML model.
              </p>

              <p>
                <strong>Exam or deadline pressure:</strong>{" "}
                {form.pressureType || "Not provided"}. This gives additional context
                about your experience but does not directly affect the current model prediction.
              </p>

              <p>
                <strong>Daily responsibilities:</strong>{" "}
                {form.dailyResponsibilities || "Not provided"}. These responsibilities
                may matter to your personal experience, but the current model does not
                use this answer to calculate its prediction.
              </p>

              {/* PERSONALIZED STRESS CONTEXT ANALYSIS */}

              <div className="stress-context-analysis">
                <h3>Your Personal Stress Insights</h3>

                <div className="stress-context-summary">
                  <p>
                    {getStressContextSummary({
                      workload: form.workload,
                      pressureType: form.pressureType,
                      dailyResponsibilities: form.dailyResponsibilities,
                      stressReasons: form.stressReasons,
                      otherStressReason: form.otherStressReason,
                    })}
                  </p>
                </div>

                {getStressContextAnalysis({
                  workload: form.workload,
                  pressureType: form.pressureType,
                  dailyResponsibilities: form.dailyResponsibilities,
                  stressReasons: form.stressReasons,
                  otherStressReason: form.otherStressReason,
                }).length > 0 ? (
                  <ul>                    
                    {getStressContextAnalysis({
                      workload: form.workload,
                      pressureType: form.pressureType,
                      dailyResponsibilities: form.dailyResponsibilities,
                      stressReasons: form.stressReasons,
                      otherStressReason: form.otherStressReason,
                    })
                      .filter((insight) => {
                        const text = insight.toLowerCase();

                        return !(
                          (text.includes("workload") &&
                            ["heavy", "overwhelming"].some((word) => text.includes(word))) ||
                          (text.includes("pressure") &&
                            ["high", "very high"].some((word) => text.includes(word))) ||
                          text.includes("identified these possible stress contributors")
                        );
                      })
                      .map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                  </ul>
                ) : (
                  <p>No additional stress insights are available.</p>
                )}

                <p>
                  These insights are based on your answers and are separate from the
                  machine-learning prediction.
                </p>
              </div>

              <p>
                This assessment is an educational estimate based on the model's supported
                lifestyle inputs. It is not a medical diagnosis, and it cannot determine
                your actual mental state with certainty.
              </p>

            </div>

          </section>

          {/* RECOMMENDATIONS */}

          <section className="recommendation-section">

            <div className="section-heading">

              <div>

                <p className="stress-eyebrow">
                  PERSONALIZED FOR YOU
                </p>

                <h2>
                  Wellness Recommendations
                </h2>

                <p>
                  Simple actions that may support your
                  overall mental and lifestyle wellness.
                </p>

              </div>

              <span className="recommendation-icon">
                ✨
              </span>

            </div>

            <div className="recommendation-grid">

              {getRecommendations().map(
                (item, index) => (
                  <div
                    className="recommendation-card"
                    key={index}
                  >

                    <div className="recommendation-card-icon">
                      {item.icon}
                    </div>

                    <div>

                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {item.text}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>

          {/* UNCERTAINTY */}

          {Number(result.confidence) < 60 && (
            <div className="uncertainty-note">

              <span>
                💡
              </span>

              <div>

                <strong>
                  Prediction has some uncertainty
                </strong>

                <p>
                  The model confidence is below 60%.
                  This result should be interpreted as
                  an educational estimate rather than
                  a definite conclusion.
                </p>

              </div>

            </div>
          )}

          {/* DISCLAIMER */}

          <div className="result-disclaimer">

            <span>
              ⚠️
            </span>

            <p>
              MindNutri provides educational wellness
              analytics and predictive estimates.
              This result is not a medical or psychiatric
              diagnosis and should not replace professional
              healthcare advice.
            </p>

          </div>

          {/* ACTION BUTTONS */}

          <div className="result-actions">

            {/* RETAKE */}

            <button
              className="secondary-btn"
              onClick={() => {

                setResult(null);

                setError("");

                
                setForm({
                  sleepDuration: "",
                  sleepQuality: "",
                  activityLevel: "",
                  stressFeeling: "",
                  occupation: "",
                  workload: "",
                  pressureType: "",
                  dailyResponsibilities: "",
                  stressReasons: [],
                  otherStressReason: "",
                  heartRateKnown: "",
                  heartRate: "",
                });

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });

              }}
            >
              ↻ Retake Assessment
            </button>

            {/* DASHBOARD */}

            <button
              className="primary-btn"
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
  // ASSESSMENT SCREEN
  // ============================================================

  return (
    <div className="stress-page">

      {/* HEADER */}

      <div className="stress-header">

        <div>

          <p className="stress-eyebrow">
            MINDNUTRI • MENTAL WELLNESS
          </p>

          <h1>
            Stress Assessment 🧠
          </h1>

          <p>
            Answer a few simple questions to understand
            your current stress level and lifestyle pattern.
          </p>

        </div>

        <div className="progress-card">

          <span>
            Assessment
          </span>

          <strong>
            1 / 1
          </strong>

        </div>

      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="stress-form"
      >

        {/* =====================================================
            SLEEP DURATION
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            😴
          </div>

          <div className="question-content">

            <h2>
              How much do you usually sleep?
            </h2>

            <p>
              Think about your average sleep on a normal day.
            </p>

            <div className="option-grid">

              {[
                "Less than 5 hours",
                "5–6 hours",
                "6–7 hours",
                "7–8 hours",
                "More than 8 hours",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.sleepDuration === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="sleepDuration"
                    value={option}
                    checked={
                      form.sleepDuration === option
                    }
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            SLEEP QUALITY
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            🌙
          </div>

          <div className="question-content">

            <h2>
              How would you rate your sleep quality?
            </h2>

            <p>
              Choose the option that best describes your sleep.
            </p>

            <div className="option-grid">

              {[
                "Very Poor",
                "Poor",
                "Average",
                "Good",
                "Excellent",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.sleepQuality === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="sleepQuality"
                    value={option}
                    checked={
                      form.sleepQuality === option
                    }
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            ACTIVITY
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            🏃
          </div>

          <div className="question-content">

            <h2>
              How active are you during the day?
            </h2>

            <p>
              Consider walking, exercise, sports and daily movement.
            </p>

            <div className="option-grid">

              {[
                "Mostly Sitting",
                "Lightly Active",
                "Moderately Active",
                "Very Active",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.activityLevel === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="activityLevel"
                    value={option}
                    checked={
                      form.activityLevel === option
                    }
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            STRESS FEELING
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            🧠
          </div>

          <div className="question-content">

            <h2>
              How stressed have you been feeling recently?
            </h2>

            <p>
              Choose the option that feels closest to you.
            </p>

            <div className="stress-options">

              {[
                "Very Relaxed",
                "Mostly Calm",
                "Moderately Stressed",
                "Highly Stressed",
                "Extremely Stressed",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.stressFeeling === option
                      ? "stress-option selected"
                      : "stress-option"
                  }
                >

                  <input
                    type="radio"
                    name="stressFeeling"
                    value={option}
                    checked={
                      form.stressFeeling === option
                    }
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        
        {/* =====================================================
            WORKLOAD
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            📚
          </div>

          <div className="question-content">

            <h2>
              How heavy is your current workload?
            </h2>

            <p>
              Consider your work, studies, exam preparation,
              deadlines and other tasks.
            </p>

            <div className="option-grid">

              {[
                "Very Light",
                "Manageable",
                "Heavy",
                "Overwhelming",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.workload === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="workload"
                    value={option}
                    checked={form.workload === option}
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        
        {/* =====================================================
            EXAM AND DEADLINE PRESSURE
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            ⏳
          </div>

          <div className="question-content">

            <h2>
              Are you experiencing exam or deadline pressure?
            </h2>

            <p>
              Consider upcoming exams, submissions, work deadlines
              or other time-sensitive responsibilities.
            </p>

            <div className="option-grid">

              {[
                "None",
                "Mild",
                "Moderate",
                "High",
                "Very High",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.pressureType === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="pressureType"
                    value={option}
                    checked={form.pressureType === option}
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        
        {/* =====================================================
            DAILY RESPONSIBILITIES
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            🏠
          </div>

          <div className="question-content">

            <h2>
              How demanding do your daily responsibilities feel?
            </h2>

            <p>
              Consider household tasks, caregiving, personal
              commitments, errands and other everyday duties.
            </p>

            <div className="option-grid">

              {[
                "Very Light",
                "Manageable",
                "Demanding",
                "Overwhelming",
                "Not Applicable",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.dailyResponsibilities === option
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name="dailyResponsibilities"
                    value={option}
                    checked={
                      form.dailyResponsibilities === option
                    }
                    onChange={handleChange}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

          </div>

        </section>

        
        {/* =====================================================
            STRESS REASONS
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            💭
          </div>

          <div className="question-content">

            <h2>
              What has been contributing to your stress recently?
            </h2>

            <p>
              Select all that apply. Your reasons may be different
              from those of other people.
            </p>

            <div className="option-grid">

              {[
                "Work or Study",
                "Exams or Deadlines",
                "Family Issues",
                "Relationship Problems",
                "Financial Worries",
                "Career or Future Uncertainty",
                "Health-Related Worries",
                "Loneliness or Social Issues",
                "Lack of Sleep or Energy",
                "Major Life Changes",
                "Other",
                "Not Sure",
                "Prefer Not to Say",
              ].map((option) => (

                <label
                  key={option}
                  className={
                    form.stressReasons.includes(option)
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="checkbox"
                    name="stressReasons"
                    value={option}
                    checked={form.stressReasons.includes(option)}
                    onChange={(e) => {
                      const selected = e.target.checked;

                      setForm((prev) => ({
                        ...prev,
                        stressReasons: selected
                          ? option === "Not Sure" ||
                            option === "Prefer Not to Say"
                            ? [option]
                            : [
                                ...prev.stressReasons.filter(
                                  (item) =>
                                    item !== "Not Sure" &&
                                    item !== "Prefer Not to Say"
                                ),
                                option,
                              ]
                          : prev.stressReasons.filter(
                              (item) => item !== option
                            ),
                        otherStressReason:
                          option === "Other" && !selected
                            ? ""
                            : prev.otherStressReason,
                      }));
                    }}
                  />

                  <span>
                    {option}
                  </span>

                </label>

              ))}

            </div>

            {form.stressReasons.includes("Other") && (

              <textarea
                name="otherStressReason"
                placeholder="If you wish, describe your stress reason..."
                value={form.otherStressReason}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="number-input"
              />

            )}

          </div>

        </section>


        {/* =====================================================
            OCCUPATION
        ===================================================== */}

        <section className="question-card">

          <div className="question-icon">
            💼
          </div>

          <div className="question-content">

            <h2>
              What best describes your daily routine?
            </h2>

            <p>
              Choose the routine that is closest to your everyday life.
            </p>

            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
            >

              <option value="">
                Select your routine
              </option>

              <option>
                Student
              </option>

              <option>
                Software / IT Professional
              </option>

              <option>
                Business Professional
              </option>

              <option>
                Healthcare Professional
              </option>

              <option>
                Teacher / Academic
              </option>

              <option>
                Homemaker
              </option>

              <option>
                Retired
              </option>

              <option>
                Other
              </option>

            </select>

          </div>

        </section>

        {/* =====================================================
            HEART RATE
        ===================================================== */}

        <section className="question-card optional-card">

          <div className="question-icon">
            ❤️
          </div>

          <div className="question-content">

            <h2>
              Do you know your heart rate?
            </h2>

            <p>
              This is optional. Don't worry if you don't know it.
            </p>

            <div className="option-grid">

              <label
                className={
                  form.heartRateKnown === "yes"
                    ? "option selected"
                    : "option"
                }
              >

                <input
                  type="radio"
                  name="heartRateKnown"
                  value="yes"
                  checked={
                    form.heartRateKnown === "yes"
                  }
                  onChange={handleChange}
                />

                <span>
                  Yes, I know it
                </span>

              </label>

              <label
                className={
                  form.heartRateKnown === "no"
                    ? "option selected"
                    : "option"
                }
              >

                <input
                  type="radio"
                  name="heartRateKnown"
                  value="no"
                  checked={
                    form.heartRateKnown === "no"
                  }
                  onChange={handleChange}
                />

                <span>
                  No, I don't know
                </span>

              </label>

            </div>

            {form.heartRateKnown === "yes" && (

              <input
                type="number"
                name="heartRate"
                placeholder="Enter heart rate (BPM)"
                value={form.heartRate}
                onChange={handleChange}
                className="number-input"
                min="30"
                max="220"
              />

            )}

          </div>

        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div className="error-message">
            ⚠️ {error}
          </div>

        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="assessment-footer">

          <div>

            <strong>
              🔒 Your information stays private
            </strong>

            <p>
              This assessment is designed for educational
              wellness insights.
            </p>

          </div>

          <button
            type="submit"
            disabled={loading}
          >

            {loading ? (
              <>
                ⏳ Analyzing...
              </>
            ) : (
              <>
                Analyze My Stress →
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}

export default StressAssessment;