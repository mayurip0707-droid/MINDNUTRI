import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WellnessInsights.css";

/*
============================================================
MINDNUTRI — WELLNESS INSIGHTS
Local Wellness Intelligence Engine
No External API
============================================================
*/

const STORAGE_KEYS = {
  mood: "mindnutri_mood_history",
  stress: "mindnutri_stress_result",
  sleepHistory: "mindnutri_sleep_history",
  sleepLatest: "mindnutri_sleep_data",
  nutrition: "mindnutri_nutrition_history",
  water: "mindnutri_water",
  healthRisk: "mindnutri_health_risk",
  goals: "mindnutri_daily_goals",
};

const TARGETS = {
  calories: 2000,
  protein: 80,
  fiber: 30,
  water: 8,
  sleep: 7,
};

function readStorage(key, fallback = null) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return fallback;
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysAgo(days) {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return getDateKey(date);
}

function normalizeDate(entry) {
  if (!entry) {
    return null;
  }

  if (entry.timestamp) {
    const date = new Date(entry.timestamp);

    if (!Number.isNaN(date.getTime())) {
      return getDateKey(date);
    }
  }

  if (entry.date) {
    const parsed = new Date(entry.date);

    if (!Number.isNaN(parsed.getTime())) {
      return getDateKey(parsed);
    }

    return entry.date;
  }

  return null;
}

function average(values) {
  const valid = values
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (!valid.length) {
    return null;
  }

  return (
    valid.reduce((sum, value) => sum + value, 0) /
    valid.length
  );
}

function calculateTrend(values) {
  const valid = values
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (valid.length < 2) {
    return {
      direction: "stable",
      change: 0,
    };
  }

  const midpoint = Math.floor(valid.length / 2);

  const firstHalf = valid.slice(0, midpoint);
  const secondHalf = valid.slice(midpoint);

  const firstAverage = average(firstHalf);
  const secondAverage = average(secondHalf);

  if (
    firstAverage === null ||
    secondAverage === null
  ) {
    return {
      direction: "stable",
      change: 0,
    };
  }

  const change = secondAverage - firstAverage;

  if (change > 4) {
    return {
      direction: "up",
      change: Number(change.toFixed(1)),
    };
  }

  if (change < -4) {
    return {
      direction: "down",
      change: Number(change.toFixed(1)),
    };
  }

  return {
    direction: "stable",
    change: Number(change.toFixed(1)),
  };
}

function WellnessInsights() {
  const navigate = useNavigate();

  const [dataVersion, setDataVersion] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [expandedInsight, setExpandedInsight] = useState(null);

  /*
  ============================================================
  LOAD ALL WELLNESS DATA
  ============================================================
  */

  const wellnessData = useMemo(() => {
    const moodHistory =
      readStorage(STORAGE_KEYS.mood, []) || [];

    const stressResult =
      readStorage(STORAGE_KEYS.stress);

    const sleepHistory =
      readStorage(STORAGE_KEYS.sleepHistory, []) || [];

    const latestSleep =
      readStorage(STORAGE_KEYS.sleepLatest);

    const nutritionHistory =
      readStorage(STORAGE_KEYS.nutrition, []) || [];

    const water =
      Number(
        localStorage.getItem(STORAGE_KEYS.water) || 0
      );

    const healthRisk =
      readStorage(STORAGE_KEYS.healthRisk);

    const goals =
      readStorage(STORAGE_KEYS.goals, []) || [];

    return {
      moodHistory: Array.isArray(moodHistory)
        ? moodHistory
        : [],

      stressResult,

      sleepHistory: Array.isArray(sleepHistory)
        ? sleepHistory
        : [],

      latestSleep,

      nutritionHistory:
        Array.isArray(nutritionHistory)
          ? nutritionHistory
          : [],

      water: Number.isFinite(water)
        ? water
        : 0,

      healthRisk,

      goals: Array.isArray(goals)
        ? goals
        : [],
    };
  }, [dataVersion]);

  /*
  ============================================================
  REFRESH WHEN USER RETURNS FROM OTHER MODULE
  ============================================================
  */

  useEffect(() => {
    const refresh = () => {
      setDataVersion((value) => value + 1);
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  /*
  ============================================================
  RECENT DATA
  ============================================================
  */

  const recentMood = useMemo(() => {
    const cutoff = getDaysAgo(selectedPeriod);

    return wellnessData.moodHistory.filter((entry) => {
      const date = normalizeDate(entry);

      return date && date >= cutoff;
    });
  }, [
    wellnessData.moodHistory,
    selectedPeriod,
  ]);

  const recentSleep = useMemo(() => {
    const cutoff = getDaysAgo(selectedPeriod);

    return wellnessData.sleepHistory.filter((entry) => {
      const date = normalizeDate(entry);

      return date && date >= cutoff;
    });
  }, [
    wellnessData.sleepHistory,
    selectedPeriod,
  ]);

  const recentNutrition = useMemo(() => {
    const cutoff = getDaysAgo(selectedPeriod);

    return wellnessData.nutritionHistory.filter(
      (entry) => {
        const date = normalizeDate(entry);

        return date && date >= cutoff;
      }
    );
  }, [
    wellnessData.nutritionHistory,
    selectedPeriod,
  ]);

  /*
  ============================================================
  MOOD SCORE
  ============================================================
  */

  const moodScore = useMemo(() => {
    const scores = recentMood.map((entry) =>
      Number(entry.moodScore)
    );

    return average(scores);
  }, [recentMood]);

  /*
  ============================================================
  STRESS SCORE
  ============================================================
  */

  const stressScore = useMemo(() => {
    if (!wellnessData.stressResult) {
      return null;
    }

    const score = Number(
      wellnessData.stressResult.stressScore
    );

    if (!Number.isFinite(score)) {
      return null;
    }

    return clamp((score / 10) * 100);
  }, [wellnessData.stressResult]);

  const stressWellnessScore =
    stressScore === null
      ? null
      : 100 - stressScore;

  /*
  ============================================================
  SLEEP SCORE
  ============================================================
  */

  const sleepScore = useMemo(() => {
    if (!recentSleep.length) {
      return null;
    }

    const scores = recentSleep.map((entry) =>
      Number(entry.score)
    );

    return average(scores);
  }, [recentSleep]);

  const averageSleep = useMemo(() => {
    if (!recentSleep.length) {
      return null;
    }

    return average(
      recentSleep.map((entry) =>
        Number(entry.duration)
      )
    );
  }, [recentSleep]);

  /*
  ============================================================
  NUTRITION SCORE
  ============================================================
  */

  const nutritionScore = useMemo(() => {
    if (!recentNutrition.length) {
      return null;
    }

    const calories = recentNutrition.reduce(
      (sum, item) =>
        sum + Number(item.calories || 0),
      0
    );

    const protein = recentNutrition.reduce(
      (sum, item) =>
        sum + Number(item.protein || 0),
      0
    );

    const fiber = recentNutrition.reduce(
      (sum, item) =>
        sum + Number(item.fiber || 0),
      0
    );

    const calorieScore =
      calories <= TARGETS.calories
        ? (calories / TARGETS.calories) * 100
        : Math.max(
            0,
            100 -
              ((calories - TARGETS.calories) /
                TARGETS.calories) *
                100
          );

    const proteinScore = Math.min(
      (protein / TARGETS.protein) * 100,
      100
    );

    const fiberScore = Math.min(
      (fiber / TARGETS.fiber) * 100,
      100
    );

    const waterScore = Math.min(
      (wellnessData.water / TARGETS.water) * 100,
      100
    );

    const categories = new Set(
      recentNutrition.map(
        (item) => item.category
      )
    ).size;

    const varietyScore = Math.min(
      categories * 20,
      100
    );

    return Math.round(
      calorieScore * 0.25 +
        proteinScore * 0.25 +
        fiberScore * 0.2 +
        waterScore * 0.15 +
        varietyScore * 0.15
    );
  }, [
    recentNutrition,
    wellnessData.water,
  ]);

  /*
  ============================================================
  ACTIVITY SCORE
  ============================================================
  */

  const activityScore = useMemo(() => {
    const activity =
      wellnessData.stressResult?.assessment
        ?.activityLevel;

    const activityMap = {
      "Mostly Sitting": 25,
      "Lightly Active": 50,
      "Moderately Active": 75,
      "Very Active": 95,
    };

    if (!activity) {
      return null;
    }

    return activityMap[activity] || null;
  }, [wellnessData.stressResult]);

  /*
  ============================================================
  OVERALL WELLNESS SCORE
  ============================================================
  */

  const overallScore = useMemo(() => {
    const scores = [];

    if (moodScore !== null) {
      scores.push({
        value: moodScore,
        weight: 0.25,
      });
    }

    if (stressWellnessScore !== null) {
      scores.push({
        value: stressWellnessScore,
        weight: 0.2,
      });
    }

    if (sleepScore !== null) {
      scores.push({
        value: sleepScore,
        weight: 0.2,
      });
    }

    if (nutritionScore !== null) {
      scores.push({
        value: nutritionScore,
        weight: 0.2,
      });
    }

    if (activityScore !== null) {
      scores.push({
        value: activityScore,
        weight: 0.15,
      });
    }

    if (!scores.length) {
      return null;
    }

    const totalWeight = scores.reduce(
      (sum, item) => sum + item.weight,
      0
    );

    const weightedScore = scores.reduce(
      (sum, item) =>
        sum + item.value * item.weight,
      0
    );

    return Math.round(
      weightedScore / totalWeight
    );
  }, [
    moodScore,
    stressWellnessScore,
    sleepScore,
    nutritionScore,
    activityScore,
  ]);

  /*
  ============================================================
  WELLNESS STATUS
  ============================================================
  */

  const wellnessStatus = useMemo(() => {
    if (overallScore === null) {
      return {
        label: "Building your profile",
        emoji: "🌱",
      };
    }

    if (overallScore >= 85) {
      return {
        label: "Excellent balance",
        emoji: "🌟",
      };
    }

    if (overallScore >= 70) {
      return {
        label: "Healthy progress",
        emoji: "🌿",
      };
    }

    if (overallScore >= 50) {
      return {
        label: "Room to improve",
        emoji: "🌤️",
      };
    }

    return {
      label: "Needs more attention",
      emoji: "💚",
    };
  }, [overallScore]);

  /*
  ============================================================
  DOMAIN CARDS
  ============================================================
  */

  const domains = [
    {
      key: "mood",
      icon: "😊",
      title: "Mood",
      value:
        moodScore !== null
          ? Math.round(moodScore)
          : null,
      suffix: "/100",
      description:
        recentMood.length
          ? `${recentMood.length} mood check-in${
              recentMood.length > 1
                ? "s"
                : ""
            } analyzed`
          : "No recent mood data",
    },

    {
      key: "stress",
      icon: "🧠",
      title: "Stress",
      value:
        stressWellnessScore !== null
          ? Math.round(stressWellnessScore)
          : null,
      suffix: "/100",
      description:
        wellnessData.stressResult
          ? `Current level: ${wellnessData.stressResult.prediction}`
          : "Complete a stress assessment",
    },

    {
      key: "sleep",
      icon: "🌙",
      title: "Sleep",
      value:
        sleepScore !== null
          ? Math.round(sleepScore)
          : null,
      suffix: "/100",
      description:
        averageSleep !== null
          ? `${averageSleep.toFixed(
              1
            )}h average sleep`
          : "No recent sleep data",
    },

    {
      key: "nutrition",
      icon: "🥗",
      title: "Nutrition",
      value:
        nutritionScore !== null
          ? nutritionScore
          : null,
      suffix: "/100",
      description:
        recentNutrition.length
          ? `${recentNutrition.length} food entries`
          : "No recent nutrition data",
    },

    {
      key: "activity",
      icon: "🏃",
      title: "Activity",
      value:
        activityScore !== null
          ? activityScore
          : null,
      suffix: "/100",
      description:
        wellnessData.stressResult
          ?.assessment?.activityLevel ||
        "No activity data",
    },
  ];

  /*
  ============================================================
  CROSS-DOMAIN PATTERNS
  ============================================================
  */

  const connections = useMemo(() => {
    const results = [];

    if (
      averageSleep !== null &&
      stressScore !== null
    ) {
      if (averageSleep < 7 && stressScore >= 5) {
        results.push({
          icon: "🌙",
          title: "Sleep–Stress connection",
          text:
            "Your recent sleep duration is below the 7-hour wellness target while your stress score is elevated.",
          strength: "Strong signal",
          type: "attention",
        });
      } else if (
        averageSleep >= 7 &&
        stressScore < 5
      ) {
        results.push({
          icon: "✨",
          title: "Sleep–Stress balance",
          text:
            "Your recent sleep duration and stress indicators are currently moving in a favorable direction together.",
          strength: "Positive pattern",
          type: "positive",
        });
      }
    }

    if (
      moodScore !== null &&
      stressScore !== null
    ) {
      if (
        moodScore < 60 &&
        stressScore >= 5
      ) {
        results.push({
          icon: "🧠",
          title: "Mood–Stress relationship",
          text:
            "Your recent mood score is lower while your stress score is elevated. This combination deserves attention in your next check-in.",
          strength: "Needs attention",
          type: "attention",
        });
      } else if (
        moodScore >= 70 &&
        stressScore < 5
      ) {
        results.push({
          icon: "😊",
          title: "Positive emotional pattern",
          text:
            "Your recent mood indicators are favorable while your stress score is relatively lower.",
          strength: "Positive pattern",
          type: "positive",
        });
      }
    }

    if (
      nutritionScore !== null &&
      wellnessData.water < 5
    ) {
      results.push({
        icon: "💧",
        title: "Nutrition–Hydration gap",
        text:
          "Your nutrition tracking is active, but your recorded water intake is still below five glasses today.",
        strength: "Action opportunity",
        type: "attention",
      });
    }

    if (
      activityScore !== null &&
      activityScore < 50 &&
      stressWellnessScore !== null &&
      stressWellnessScore < 60
    ) {
      results.push({
        icon: "🏃",
        title: "Activity–Wellness opportunity",
        text:
          "Your current activity indicator is relatively low alongside a lower stress-wellness score. Gentle movement may be a useful habit to explore.",
        strength: "Action opportunity",
        type: "attention",
      });
    }

    return results;
  }, [
    averageSleep,
    stressScore,
    moodScore,
    nutritionScore,
    wellnessData.water,
    activityScore,
    stressWellnessScore,
  ]);

  /*
  ============================================================
  TREND ANALYSIS
  ============================================================
  */

  const moodTrend = useMemo(
    () =>
      calculateTrend(
        recentMood.map((entry) =>
          Number(entry.moodScore)
        )
      ),
    [recentMood]
  );

  const sleepTrend = useMemo(
    () =>
      calculateTrend(
        recentSleep.map((entry) =>
          Number(entry.score)
        )
      ),
    [recentSleep]
  );

  /*
  ============================================================
  PERSONALIZED INSIGHTS
  ============================================================
  */

  const insights = useMemo(() => {
    const generated = [];

    if (
      moodTrend.direction === "up" &&
      recentMood.length >= 3
    ) {
      generated.push({
        id: "mood-improving",
        icon: "😊",
        category: "Emotional Wellness",
        title: "Your mood is showing positive movement",
        text:
          "Your recent mood scores have moved upward across the selected period.",
        action:
          "Continue recording your mood to understand which daily habits support this pattern.",
        priority: "positive",
      });
    }

    if (
      moodTrend.direction === "down" &&
      recentMood.length >= 3
    ) {
      generated.push({
        id: "mood-declining",
        icon: "💭",
        category: "Emotional Wellness",
        title: "Your recent mood needs attention",
        text:
          "Your recent mood scores show a downward movement compared with the earlier part of the selected period.",
        action:
          "Use your next journal entry to note what may have influenced the change.",
        priority: "attention",
      });
    }

    if (
      averageSleep !== null &&
      averageSleep < 7
    ) {
      generated.push({
        id: "sleep-low",
        icon: "🌙",
        category: "Sleep Wellness",
        title: "Sleep duration is your current opportunity",
        text:
          `Your average recorded sleep is ${averageSleep.toFixed(
            1
          )} hours, below the 7-hour target used by this wellness engine.`,
        action:
          "Try maintaining a more consistent sleep and wake schedule.",
        priority: "attention",
      });
    }

    if (
      sleepTrend.direction === "up" &&
      recentSleep.length >= 3
    ) {
      generated.push({
        id: "sleep-improving",
        icon: "✨",
        category: "Sleep Wellness",
        title: "Your sleep pattern is improving",
        text:
          "Your recent sleep scores are trending upward.",
        action:
          "Keep the routines that appear to support your better sleep days.",
        priority: "positive",
      });
    }

    if (
      nutritionScore !== null &&
      nutritionScore < 60
    ) {
      generated.push({
        id: "nutrition-focus",
        icon: "🥗",
        category: "Nutrition",
        title: "Nutrition consistency can improve",
        text:
          "Your current nutrition score suggests that some daily nutrition targets are not yet being consistently reached.",
        action:
          "Focus on balanced meals containing protein, fiber-rich foods and adequate hydration.",
        priority: "attention",
      });
    }

    if (
      wellnessData.water < 5
    ) {
      generated.push({
        id: "hydration",
        icon: "💧",
        category: "Hydration",
        title: "Hydration is today's quick win",
        text:
          `You have recorded ${wellnessData.water} of ${TARGETS.water} glasses.`,
        action:
          "Add one glass now and continue spacing water intake through the day.",
        priority: "attention",
      });
    }

    if (
      stressWellnessScore !== null &&
      stressWellnessScore < 50
    ) {
      generated.push({
        id: "stress",
        icon: "🧠",
        category: "Mental Wellness",
        title: "Your stress indicator deserves attention",
        text:
          "Your current stress assessment is reducing your overall wellness balance score.",
        action:
          "Consider a short breathing exercise, gentle movement or a calmer evening routine.",
        priority: "attention",
      });
    }

    if (
      overallScore !== null &&
      overallScore >= 75
    ) {
      generated.push({
        id: "overall-positive",
        icon: "🌟",
        category: "Overall Wellness",
        title: "Your wellness foundation looks strong",
        text:
          "Your available wellness indicators currently combine into a favorable overall pattern.",
        action:
          "Focus on consistency rather than trying to change everything at once.",
        priority: "positive",
      });
    }

    return generated;
  }, [
    moodTrend,
    sleepTrend,
    recentMood.length,
    recentSleep.length,
    averageSleep,
    nutritionScore,
    wellnessData.water,
    stressWellnessScore,
    overallScore,
  ]);

  /*
  ============================================================
  PERSONAL WELLNESS PROFILE
  ============================================================
  */

  const profile = useMemo(() => {
    if (
      stressWellnessScore !== null &&
      stressWellnessScore < 50
    ) {
      return {
        name: "High Stress Pattern",
        icon: "🧠",
        description:
          "Your current wellness indicators show that stress management may be one of your highest-value improvement areas.",
      };
    }

    if (
      averageSleep !== null &&
      averageSleep < 7
    ) {
      return {
        name: "Sleep Improvement Pattern",
        icon: "🌙",
        description:
          "Your recent sleep duration suggests that improving sleep consistency may have a meaningful impact on your overall wellness routine.",
      };
    }

    if (
      nutritionScore !== null &&
      nutritionScore < 60
    ) {
      return {
        name: "Nutrition Improvement Pattern",
        icon: "🥗",
        description:
          "Your nutrition tracking indicates that food quality, nutrient balance or consistency could be an important focus area.",
      };
    }

    if (
      activityScore !== null &&
      activityScore < 50
    ) {
      return {
        name: "Low Activity Pattern",
        icon: "🏃",
        description:
          "Your recorded activity indicator is relatively low, making gentle daily movement a useful wellness focus.",
      };
    }

    return {
      name: "Balanced Wellness Pattern",
      icon: "🌿",
      description:
        "Your currently available wellness indicators show a relatively balanced pattern across the tracked areas.",
    };
  }, [
    stressWellnessScore,
    averageSleep,
    nutritionScore,
    activityScore,
  ]);

  /*
  ============================================================
  NEXT ACTIONS
  ============================================================
  */

  const actions = useMemo(() => {
    const list = [];

    if (
      stressWellnessScore !== null &&
      stressWellnessScore < 60
    ) {
      list.push({
        icon: "🫁",
        title: "Take a 3-minute breathing break",
        reason:
          "Your stress indicator is currently one of your main wellness opportunities.",
        route: "/stress-assessment",
      });
    }

    if (
      averageSleep !== null &&
      averageSleep < 7
    ) {
      list.push({
        icon: "🌙",
        title: "Protect tonight's sleep routine",
        reason:
          "Your recent average sleep is below the target used by MindNutri.",
        route: "/sleep",
      });
    }

    if (
      wellnessData.water < 5
    ) {
      list.push({
        icon: "💧",
        title: "Add one glass of water",
        reason:
          "Hydration is currently one of your quickest improvement opportunities.",
        route: "/nutrition",
      });
    }

    if (
      nutritionScore !== null &&
      nutritionScore < 65
    ) {
      list.push({
        icon: "🥗",
        title: "Build a balanced next meal",
        reason:
          "Your nutrition score shows room for improvement.",
        route: "/nutrition",
      });
    }

    if (
      moodScore !== null &&
      moodScore < 60
    ) {
      list.push({
        icon: "💭",
        title: "Check in with your mood",
        reason:
          "Your recent mood score suggests that an additional reflection could be useful.",
        route: "/mood-journal",
      });
    }

    if (!list.length) {
      list.push({
        icon: "🌿",
        title: "Maintain your current routine",
        reason:
          "Your available wellness indicators are currently in a favorable range.",
        route: "/dashboard",
      });
    }

    return list.slice(0, 4);
  }, [
    stressWellnessScore,
    averageSleep,
    wellnessData.water,
    nutritionScore,
    moodScore,
  ]);

  /*
  ============================================================
  DATA COMPLETENESS
  ============================================================
  */

  const completedDomains = [
    moodScore !== null,
    stressWellnessScore !== null,
    sleepScore !== null,
    nutritionScore !== null,
    activityScore !== null,
  ].filter(Boolean).length;

  const dataCompleteness =
    Math.round(
      (completedDomains / 5) * 100
    );

  /*
  ============================================================
  TREND LABEL
  ============================================================
  */

  const getTrendLabel = (trend) => {
    if (trend.direction === "up") {
      return {
        icon: "↗",
        text: "Improving",
      };
    }

    if (trend.direction === "down") {
      return {
        icon: "↘",
        text: "Declining",
      };
    }

    return {
      icon: "→",
      text: "Stable",
    };
  };

  const moodTrendLabel =
    getTrendLabel(moodTrend);

  const sleepTrendLabel =
    getTrendLabel(sleepTrend);

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="wellness-insights-page">

      <div className="wellness-insights-container">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="wi-header">

          <div>
            <p className="wi-eyebrow">
              MINDNUTRI • WELLNESS INTELLIGENCE
            </p>

            <h1>
              Understand Your Wellness 🌿
            </h1>

            <p className="wi-subtitle">
              MindNutri brings together your mood,
              stress, sleep, nutrition and lifestyle
              data to uncover meaningful personal
              wellness patterns.
            </p>
          </div>
         
          <div className="wi-back-area">

            <button
              type="button"
              onClick={() =>
              navigate("/dashboard")
              }
            >
              ← Back to Dashboard
             </button>

          </div>
              
        </header>

        {/* =====================================================
            PERIOD FILTER
        ====================================================== */}

        <div className="wi-toolbar">

          <div>
            <span className="wi-toolbar-label">
              ANALYSIS PERIOD
            </span>

            <div className="period-buttons">

              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={
                    selectedPeriod === days
                      ? "period-button active"
                      : "period-button"
                  }
                  onClick={() =>
                    setSelectedPeriod(days)
                  }
                >
                  {days} Days
                </button>
              ))}

            </div>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              setDataVersion(
                (value) => value + 1
              )
            }
          >
            ↻ Refresh Insights
          </button>

        </div>

        {/* =====================================================
            HERO SCORE
        ====================================================== */}

        <section className="wi-hero">

          <div className="wi-score-area">

            <div className="wi-score-ring">

              <div className="wi-score-inner">

                <span>
                  {overallScore !== null
                    ? overallScore
                    : "—"}
                </span>

                <small>
                  /100
                </small>

              </div>

            </div>

            <div className="wi-score-copy">

              <p className="wi-eyebrow">
                YOUR WELLNESS BALANCE
              </p>

              <h2>
                {wellnessStatus.emoji}{" "}
                {wellnessStatus.label}
              </h2>

              <p>
                This score combines the wellness
                areas for which MindNutri currently
                has recorded data.
              </p>

              <div className="wi-data-quality">

                <div className="wi-data-quality-top">
                  <span>
                    Wellness data coverage
                  </span>

                  <strong>
                    {dataCompleteness}%
                  </strong>
                </div>

                <div className="wi-mini-progress">
                  <div
                    style={{
                      width: `${dataCompleteness}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>

          <div className="wi-hero-side">

            <span className="wi-hero-side-icon">
              ✨
            </span>

            <p>
              MINDNUTRI'S READ
            </p>

            <strong>
              {connections.length
                ? `${connections.length} meaningful pattern${
                    connections.length > 1
                      ? "s"
                      : ""
                  } detected`
                : "Keep tracking to discover patterns"}
            </strong>

            <small>
              Insights become more meaningful as
              you build a consistent wellness history.
            </small>

          </div>

        </section>

        {/* =====================================================
            DOMAIN SNAPSHOT
        ====================================================== */}

        <section className="wi-section">

          <div className="wi-section-heading">

            <div>
              <p className="wi-eyebrow">
                WELLNESS SNAPSHOT
              </p>

              <h2>
                Five Dimensions of Your Wellbeing
              </h2>

              <p>
                A quick view of the areas currently
                shaping your wellness profile.
              </p>
            </div>

          </div>

          <div className="wi-domain-grid">

            {domains.map((domain) => (

              <div
                className="wi-domain-card"
                key={domain.key}
              >

                <div className="wi-domain-top">

                  <span className="wi-domain-icon">
                    {domain.icon}
                  </span>

                  <span className="wi-domain-name">
                    {domain.title}
                  </span>

                </div>

                <div className="wi-domain-score">

                  <strong>
                    {domain.value !== null
                      ? domain.value
                      : "—"}
                  </strong>

                  <small>
                    {domain.value !== null
                      ? domain.suffix
                      : "No data"}
                  </small>

                </div>

                <div className="wi-domain-bar">

                  <div
                    style={{
                      width: `${
                        domain.value || 0
                      }%`,
                    }}
                  />

                </div>

                <p>
                  {domain.description}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* =====================================================
            WHAT MINDNUTRI NOTICED
        ====================================================== */}

        <section className="wi-section">

          <div className="wi-section-heading">

            <div>
              <p className="wi-eyebrow">
                PERSONALIZED INTELLIGENCE
              </p>

              <h2>
                What MindNutri Noticed
              </h2>

              <p>
                These observations are based only
                on the wellness information you have
                recorded.
              </p>
            </div>

          </div>

          {insights.length ? (

            <div className="wi-insights-grid">

              {insights.map((insight) => (

                <article
                  className={`wi-insight-card ${insight.priority}`}
                  key={insight.id}
                >

                  <div className="wi-insight-top">

                    <span className="wi-insight-icon">
                      {insight.icon}
                    </span>

                    <span className="wi-insight-category">
                      {insight.category}
                    </span>

                  </div>

                  <h3>
                    {insight.title}
                  </h3>

                  <p>
                    {insight.text}
                  </p>

                  <button
                    type="button"
                    className="wi-insight-expand"
                    onClick={() =>
                      setExpandedInsight(
                        expandedInsight === insight.id
                          ? null
                          : insight.id
                      )
                    }
                  >
                    {expandedInsight ===
                    insight.id
                      ? "Hide action ↑"
                      : "See what you can do →"}
                  </button>

                  {expandedInsight ===
                    insight.id && (
                    <div className="wi-insight-action">
                      <span>🎯</span>

                      <p>
                        {insight.action}
                      </p>
                    </div>
                  )}

                </article>

              ))}

            </div>

          ) : (

            <div className="wi-empty-state">

              <span>🔍</span>

              <h3>
                Your pattern is still forming
              </h3>

              <p>
                Keep using Mood Journal, Stress
                Assessment, Sleep Tracker and
                Nutrition Logger. MindNutri will
                use the recorded history to create
                more meaningful personalized
                insights.
              </p>

            </div>

          )}

        </section>

        {/* =====================================================
            CONNECTIONS
        ====================================================== */}

        <section className="wi-section">

          <div className="wi-section-heading">

            <div>
              <p className="wi-eyebrow">
                CROSS-DOMAIN ANALYSIS
              </p>

              <h2>
                Your Wellness Connections 🔗
              </h2>

              <p>
                The most useful insights often appear
                when two or more wellness areas are
                viewed together.
              </p>
            </div>

          </div>

          {connections.length ? (

            <div className="wi-connections">

              {connections.map(
                (connection, index) => (

                  <div
                    className={`wi-connection-card ${connection.type}`}
                    key={`${connection.title}-${index}`}
                  >

                    <div className="wi-connection-icon">
                      {connection.icon}
                    </div>

                    <div className="wi-connection-content">

                      <div className="wi-connection-title">

                        <h3>
                          {connection.title}
                        </h3>

                        <span>
                          {connection.strength}
                        </span>

                      </div>

                      <p>
                        {connection.text}
                      </p>

                    </div>

                    <div className="wi-connection-arrow">
                      →
                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="wi-connection-empty">

              <div>
                🌱
              </div>

              <section>

                <strong>
                  More data will unlock deeper
                  connections
                </strong>

                <p>
                  Record wellness information across
                  multiple areas to allow MindNutri to
                  compare patterns between them.
                </p>

              </section>

            </div>

          )}

        </section>

        {/* =====================================================
            TRENDS
        ====================================================== */}

        <section className="wi-section">

          <div className="wi-section-heading">

            <div>
              <p className="wi-eyebrow">
                DIRECTION OF CHANGE
              </p>

              <h2>
                Your Recent Wellness Movement
              </h2>

              <p>
                Trends show how your recorded
                indicators are changing over time.
              </p>
            </div>

          </div>

          <div className="wi-trend-grid">

            <div className="wi-trend-card">

              <div className="wi-trend-icon">
                😊
              </div>

              <div>
                <span>
                  MOOD TREND
                </span>

                <strong>
                  {moodTrendLabel.icon}{" "}
                  {moodTrendLabel.text}
                </strong>

                <small>
                  {recentMood.length >= 2
                    ? `${Math.abs(
                        moodTrend.change
                      )} point change`
                    : "Need more check-ins"}
                </small>
              </div>

            </div>

            <div className="wi-trend-card">

              <div className="wi-trend-icon">
                🌙
              </div>

              <div>
                <span>
                  SLEEP TREND
                </span>

                <strong>
                  {sleepTrendLabel.icon}{" "}
                  {sleepTrendLabel.text}
                </strong>

                <small>
                  {recentSleep.length >= 2
                    ? `${Math.abs(
                        sleepTrend.change
                      )} point change`
                    : "Need more sleep records"}
                </small>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            WELLNESS PROFILE
        ====================================================== */}

        <section className="wi-profile-card">

          <div className="wi-profile-icon">
            {profile.icon}
          </div>

          <div className="wi-profile-content">

            <p className="wi-eyebrow">
              YOUR CURRENT WELLNESS PROFILE
            </p>

            <h2>
              {profile.name}
            </h2>

            <p>
              {profile.description}
            </p>

          </div>

          <div className="wi-profile-tag">
            Pattern
          </div>

        </section>

        {/* =====================================================
            NEXT BEST ACTIONS
        ====================================================== */}

        <section className="wi-section">

          <div className="wi-section-heading">

            <div>
              <p className="wi-eyebrow">
                PERSONALIZED ACTION PLAN
              </p>

              <h2>
                Your Next Best Actions 🎯
              </h2>

              <p>
                Small actions selected from the
                wellness areas currently needing
                the most attention.
              </p>
            </div>

          </div>

          <div className="wi-actions-grid">

            {actions.map((action, index) => (

              <button
                type="button"
                className="wi-action-card"
                key={`${action.title}-${index}`}
                onClick={() =>
                  navigate(action.route)
                }
              >

                <span className="wi-action-number">
                  0{index + 1}
                </span>

                <span className="wi-action-icon">
                  {action.icon}
                </span>

                <strong>
                  {action.title}
                </strong>

                <p>
                  {action.reason}
                </p>

                <span className="wi-action-link">
                  Take action →
                </span>

              </button>

            ))}

          </div>

        </section>

        {/* =====================================================
            DATA SOURCES
        ====================================================== */}

        <section className="wi-data-card">

          <div>

            <p className="wi-eyebrow">
              WELLNESS INTELLIGENCE ENGINE
            </p>

            <h2>
              Built from your own wellness journey
            </h2>

            <p>
              MindNutri analyzes the information
              you record across its wellness modules.
              No external AI service is required for
              this analysis.
            </p>

          </div>

          <div className="wi-data-source-list">

            <span>🧠 Stress</span>
            <span>💭 Mood</span>
            <span>🌙 Sleep</span>
            <span>🥗 Nutrition</span>
            <span>💧 Hydration</span>
            <span>🏃 Activity</span>

          </div>

        </section>

        {/* =====================================================
            DISCLAIMER
        ====================================================== */}

        <div className="wi-disclaimer">

          <span>ⓘ</span>

          <p>
            MindNutri Wellness Insights are educational
            wellness analytics generated from the
            information you provide. They are intended
            to help you understand patterns and build
            healthier habits. They are not medical,
            psychiatric or clinical diagnoses.
          </p>

        </div>

      </div>
    </div>
  );
}

export default WellnessInsights;