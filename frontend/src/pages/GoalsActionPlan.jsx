import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GoalsActionPlan.css";

const GoalsActionPlan = () => {
  const navigate = useNavigate();

  // ============================================================
  // LOCAL STORAGE KEYS
  // ============================================================

  const GOALS_KEY = "mindnutri_daily_goals";
  const GOALS_COMPLETION_KEY =
    "mindnutri_daily_goals_completion";

  // ============================================================
  // STATE
  // ============================================================

  const [completedTasks, setCompletedTasks] = useState({});
  const [goals, setGoals] = useState([]);

  // ============================================================
  // READ LOCAL STORAGE DATA
  // ============================================================

  const getStoredData = (key) => {
    try {
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Unable to read ${key}:`, error);
      return null;
    }
  };

  // ============================================================
  // GENERATE PERSONALIZED GOALS
  // ============================================================

  const generateGoals = () => {
    const generatedGoals = [];

    // ----------------------------------------------------------
    // SLEEP DATA
    // ----------------------------------------------------------

    const sleepHistory =
      getStoredData("mindnutri_sleep_history") || [];

    const latestSleep =
      getStoredData("mindnutri_sleep_data");

    if (latestSleep) {
      const sleepDuration =
        Number(latestSleep.duration || 0);

      if (sleepDuration < 7) {
        generatedGoals.push({
          id: "sleep-goal",
          category: "Sleep",
          icon: "🌙",
          title: "Improve Sleep Duration",
          description:
            "Create enough sleep opportunity to support your daily energy.",
          target:
            "Aim for 7–9 hours of sleep.",
          priority: "High",
        });
      } else {
        generatedGoals.push({
          id: "sleep-routine",
          category: "Sleep",
          icon: "🌙",
          title: "Maintain Your Sleep Routine",
          description:
            "Keep your current healthy sleep pattern consistent.",
          target:
            "Maintain a regular bedtime and wake-up schedule.",
          priority: "Medium",
        });
      }
    } else if (sleepHistory.length === 0) {
      generatedGoals.push({
        id: "sleep-track",
        category: "Sleep",
        icon: "🌙",
        title: "Start Sleep Tracking",
        description:
          "Build a useful sleep pattern by recording your sleep regularly.",
        target:
          "Log your sleep and wake time today.",
        priority: "Medium",
      });
    }

    // ----------------------------------------------------------
    // STRESS DATA
    // ----------------------------------------------------------

    const stressData =
      getStoredData("mindnutri_stress_result") ||
      getStoredData("mindnutri_stress_data");

    if (stressData) {
      const prediction =
        String(
          stressData.prediction || ""
        ).toLowerCase();

      const rawScore =
        stressData.stressScore ??
        stressData.score;

      const stressScore =
        Number(rawScore);

      const isHighStress =
        prediction === "high" ||
        (!Number.isNaN(stressScore) &&
          stressScore >= 7);

      if (isHighStress) {
        generatedGoals.push({
          id: "stress-goal",
          category: "Mental Wellness",
          icon: "🧘",
          title: "Create a Calm Break",
          description:
            "Give yourself a short intentional break during the day.",
          target:
            "Take 5–10 minutes for breathing, relaxation or quiet time.",
          priority: "High",
        });
      } else {
        generatedGoals.push({
          id: "mental-wellness-goal",
          category: "Mental Wellness",
          icon: "🧠",
          title: "Protect Your Mental Wellbeing",
          description:
            "Continue small daily habits that support emotional balance.",
          target:
            "Take one intentional wellbeing break today.",
          priority: "Medium",
        });
      }
    } else {
      generatedGoals.push({
        id: "stress-check",
        category: "Mental Wellness",
        icon: "🧠",
        title: "Check Your Wellness",
        description:
          "Complete your wellness assessment to help MindNutri personalize future actions.",
        target:
          "Complete the stress assessment.",
        priority: "Medium",
      });
    }

    // ----------------------------------------------------------
    // MOOD JOURNAL DATA
    // ----------------------------------------------------------

    const moodHistory =
      getStoredData("mindnutri_mood_history") || [];

    const latestMood =
      getStoredData("mindnutri_mood_data");

    if (
      !latestMood &&
      moodHistory.length === 0
    ) {
      generatedGoals.push({
        id: "mood-goal",
        category: "Mood",
        icon: "😊",
        title: "Record Today's Mood",
        description:
          "Writing a short journal entry can help you keep track of how you are feeling.",
        target:
          "Write one short mood journal entry today.",
        priority: "Medium",
      });
    } else {
      generatedGoals.push({
        id: "mood-reflection",
        category: "Mood",
        icon: "💭",
        title: "Make Time for Reflection",
        description:
          "Continue your mood journaling habit and notice positive moments.",
        target:
          "Spend a few minutes reflecting on today's mood.",
        priority: "Low",
      });
    }

    // ----------------------------------------------------------
    // NUTRITION DATA
    // ----------------------------------------------------------

    const nutritionData =
      getStoredData(
        "mindnutri_nutrition_data"
      );

    const nutritionHistory =
      getStoredData(
        "mindnutri_nutrition_history"
      ) || [];

    if (
      !nutritionData &&
      nutritionHistory.length === 0
    ) {
      generatedGoals.push({
        id: "nutrition-goal",
        category: "Nutrition",
        icon: "🥗",
        title: "Log Your Meals",
        description:
          "Start recording your meals so MindNutri can understand your eating pattern.",
        target:
          "Record your meals for today.",
        priority: "Medium",
      });
    } else {
      generatedGoals.push({
        id: "nutrition-habit",
        category: "Nutrition",
        icon: "🥗",
        title: "Keep Your Nutrition Routine",
        description:
          "Continue logging meals and making balanced food choices.",
        target:
          "Record your meals and include a balanced food choice today.",
        priority: "Medium",
      });
    }

    // ----------------------------------------------------------
    // DAILY MOVEMENT
    // ----------------------------------------------------------

    generatedGoals.push({
      id: "movement-goal",
      category: "Lifestyle",
      icon: "🚶",
      title: "Add Some Daily Movement",
      description:
        "Regular movement can support energy, routine and overall wellness.",
      target:
        "Take a short walk or do light movement during the day.",
      priority: "Low",
    });

    // ==========================================================
    // EXACTLY 5 GOALS
    // Each goal = 20% progress
    // ==========================================================

    return generatedGoals.slice(0, 5);
  };

  // ============================================================
  // LOAD SAVED GOALS + COMPLETION STATUS
  // ============================================================

  useEffect(() => {
    try {
      // --------------------------------------------------------
      // LOAD SAVED GOALS
      // --------------------------------------------------------

      const savedGoals =
        localStorage.getItem(GOALS_KEY);

      if (savedGoals) {
        const parsedGoals =
          JSON.parse(savedGoals);

        if (
          Array.isArray(parsedGoals) &&
          parsedGoals.length > 0
        ) {
          setGoals(parsedGoals);
        } else {
          const newGoals =
            generateGoals();

          setGoals(newGoals);

          localStorage.setItem(
            GOALS_KEY,
            JSON.stringify(newGoals)
          );
        }
      } else {
        const newGoals =
          generateGoals();

        setGoals(newGoals);

        localStorage.setItem(
          GOALS_KEY,
          JSON.stringify(newGoals)
        );
      }

      // --------------------------------------------------------
      // LOAD SAVED COMPLETION STATUS
      // --------------------------------------------------------

      const savedCompletion =
        localStorage.getItem(
          GOALS_COMPLETION_KEY
        );

      if (savedCompletion) {
        const parsedCompletion =
          JSON.parse(savedCompletion);

        if (
          parsedCompletion &&
          typeof parsedCompletion === "object"
        ) {
          setCompletedTasks(
            parsedCompletion
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load saved goals data:",
        error
      );

      const newGoals =
        generateGoals();

      setGoals(newGoals);
      setCompletedTasks({});

      localStorage.setItem(
        GOALS_KEY,
        JSON.stringify(newGoals)
      );

      localStorage.setItem(
        GOALS_COMPLETION_KEY,
        JSON.stringify({})
      );
    }
  }, []);

  // ============================================================
  // TASK COMPLETION
  // ============================================================

  const toggleTask = (goalId) => {
    setCompletedTasks((previous) => {
      const updated = {
        ...previous,
        [goalId]: !previous[goalId],
      };

      // --------------------------------------------------------
      // SAVE COMPLETION STATUS IMMEDIATELY
      // --------------------------------------------------------

      localStorage.setItem(
        GOALS_COMPLETION_KEY,
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // ============================================================
  // REFRESH PERSONALIZED PLAN
  // ============================================================

  const refreshPlan = () => {
    const newGoals =
      generateGoals();

    setGoals(newGoals);

    // ----------------------------------------------------------
    // PRESERVE COMPLETION STATUS
    // ----------------------------------------------------------

    setCompletedTasks((previous) => {
      const updatedCompletion = {};

      newGoals.forEach((goal) => {
        if (previous[goal.id]) {
          updatedCompletion[goal.id] = true;
        }
      });

      // Save updated completion status
      localStorage.setItem(
        GOALS_COMPLETION_KEY,
        JSON.stringify(
          updatedCompletion
        )
      );

      return updatedCompletion;
    });

    // ----------------------------------------------------------
    // SAVE NEW GOALS
    // ----------------------------------------------------------

    localStorage.setItem(
      GOALS_KEY,
      JSON.stringify(newGoals)
    );
  };

  // ============================================================
  // COMPLETED COUNT
  // ============================================================

  const completedCount = useMemo(() => {
    return goals.filter(
      (goal) =>
        completedTasks[goal.id] === true
    ).length;
  }, [
    goals,
    completedTasks,
  ]);

  // ============================================================
  // PROGRESS
  // ============================================================

  const progress =
    goals.length > 0
      ? Math.round(
          (completedCount /
            goals.length) *
            100
        )
      : 0;

  // ============================================================
  // TODAY
  // ============================================================

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="goals-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="goals-header">

        <div>

          <span className="goals-label">
            DAILY WELLNESS PLANNING
          </span>

          <h1>
            Goals & Action Plan
          </h1>

          <p>
            Small personalized actions to help you
            build healthier daily habits.
          </p>

        </div>

        <div className="goals-header-actions">

          <button
            type="button"
            className="back-dashboard-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <div className="goals-header-icon">
            🎯
          </div>

        </div>

      </div>

      {/* ======================================================
          DATE + PROGRESS
      ====================================================== */}

      <div className="goals-overview">

        <div className="today-box">

          <span>
            📅
          </span>

          <div>

            <small>
              TODAY
            </small>

            <strong>
              {today}
            </strong>

          </div>

        </div>

        <div className="progress-box">

          <div className="progress-heading">

            <span>
              Today's Progress
            </span>

            <strong>
              {progress}%
            </strong>

          </div>

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <small>
            {completedCount} of {goals.length} actions completed
          </small>

        </div>

      </div>

      {/* ======================================================
          PERSONALIZED MESSAGE
      ====================================================== */}

      <div className="personalized-plan-box">

        <div className="plan-icon">
          ✨
        </div>

        <div>

          <h2>
            Your plan for today
          </h2>

          <p>
            These actions are selected using the
            wellness information currently stored
            in MindNutri.
          </p>

        </div>

      </div>

      {/* ======================================================
          GOALS
      ====================================================== */}

      <div className="goals-section">

        <div className="section-heading">

          <div>

            <h2>
              Your Personalized Goals
            </h2>

            <p>
              Complete the actions that fit your day.
            </p>

          </div>

          <button
            type="button"
            className="refresh-plan-btn"
            onClick={refreshPlan}
          >
            🔄 Refresh Plan
          </button>

        </div>

        <div className="goals-grid">

          {goals.map((goal) => (

            <div
              key={goal.id}
              className={`goal-card ${
                completedTasks[goal.id]
                  ? "completed"
                  : ""
              }`}
            >

              {/* GOAL TOP */}

              <div className="goal-top">

                <div className="goal-icon">
                  {goal.icon}
                </div>

                <span
                  className={`priority-badge ${goal.priority.toLowerCase()}`}
                >
                  {goal.priority}
                </span>

              </div>

              {/* CATEGORY */}

              <span className="goal-category">
                {goal.category}
              </span>

              {/* TITLE */}

              <h3>
                {goal.title}
              </h3>

              {/* DESCRIPTION */}

              <p>
                {goal.description}
              </p>

              {/* TARGET */}

              <div className="goal-target">

                <span>
                  🎯
                </span>

                <div>

                  <small>
                    TODAY'S TARGET
                  </small>

                  <strong>
                    {goal.target}
                  </strong>

                </div>

              </div>

              {/* COMPLETE BUTTON */}

              <button
                type="button"
                className="complete-goal-btn"
                onClick={() =>
                  toggleTask(goal.id)
                }
              >

                {completedTasks[goal.id]
                  ? "✓ Completed"
                  : "Mark as Complete"}

              </button>

            </div>

          ))}

        </div>

      </div>

      {/* ======================================================
          COMPLETION MESSAGE
      ====================================================== */}

      {goals.length > 0 &&
        completedCount ===
          goals.length && (

          <div className="all-complete-box">

            <span>
              🎉
            </span>

            <div>

              <h3>
                Great job! Today's plan is complete.
              </h3>

              <p>
                You've completed all your planned
                wellness actions for today.
              </p>

            </div>

          </div>

        )}

      {/* ======================================================
          EDUCATIONAL NOTICE
      ====================================================== */}

      <div className="goals-disclaimer">

        <span>
          ℹ️
        </span>

        <p>
          Goals are generated from the wellness
          information available in MindNutri and are
          intended for general wellness support.
          They are not medical treatment or diagnosis.
        </p>

      </div>

    </div>
  );
};

export default GoalsActionPlan;