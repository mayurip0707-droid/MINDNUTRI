import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WeeklyWellnessReport.css";

const WeeklyWellnessReport = () => {
  const navigate = useNavigate();

  // ============================================================
  // LOCAL STORAGE KEYS
  // ============================================================

  const STORAGE_KEYS = {
    stressResult: "mindnutri_stress_result",
    stressData: "mindnutri_stress_data",

    moodHistory: "mindnutri_mood_history",
    moodData: "mindnutri_mood_data",

    sleepData: "mindnutri_sleep_data",
    sleepHistory: "mindnutri_sleep_history",

    nutritionData: "mindnutri_nutrition_data",
    nutritionHistory: "mindnutri_nutrition_history",

    // Goals
    goals: "mindnutri_daily_goals",
    goalsCompletion: "mindnutri_daily_goals_completion",
  };

  // ============================================================
  // STATE
  // ============================================================

  const [reportData, setReportData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // ============================================================
  // SAFE LOCAL STORAGE READER
  // ============================================================

  const readStorage = (key) => {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(`Unable to read ${key}:`, error);
      return null;
    }
  };

  // ============================================================
  // NUMBER HELPER
  // ============================================================

  const toNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  };

  // ============================================================
  // GET ARRAY
  // ============================================================

  const getArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    return [];
  };

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getDateFromRecord = (record) => {
    if (!record || typeof record !== "object") {
      return null;
    }

    const dateFields = [
      record.date,
      record.createdAt,
      record.timestamp,
      record.created_at,
      record.loggedAt,
      record.logged_at,
    ];

    for (const value of dateFields) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      // Handle DD/MM/YYYY format
      if (typeof value === "string") {
        const dmyMatch = value.match(
          /^(\d{2})\/(\d{2})\/(\d{4})$/
        );

        if (dmyMatch) {
          const [, day, month, year] = dmyMatch;
          const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );

          if (
            date.getFullYear() === Number(year) &&
            date.getMonth() === Number(month) - 1 &&
            date.getDate() === Number(day)
          ) {
            return date;
          }

          continue;
        }

        // Handle YYYY-MM-DD as a local calendar date
        const ymdMatch = value.match(
          /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (ymdMatch) {
          const [, year, month, day] = ymdMatch;
          const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );

          if (!Number.isNaN(date.getTime())) {
            return date;
          }

          continue;
        }
      }

      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

  // Fallback to numeric ID if it is a timestamp
  if (typeof record.id === "number" && record.id > 0) {
    const date = new Date(record.id);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

  
  const isWithinLastSevenDays = (date) => {
    // Exclude records with missing or invalid dates.
    if (
      !(date instanceof Date) ||
      Number.isNaN(date.getTime())
    ) {
      return false;
    }

    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
  };


  // ============================================================
  // FILTER WEEKLY RECORDS
  // ============================================================

  const getWeeklyRecords = (records) => {
    const array = getArray(records);

    return array.filter((record) => {
      const date = getDateFromRecord(record);

      return isWithinLastSevenDays(date);
    });
  };

  // ============================================================
  // STRESS DATA
  // ============================================================

  const calculateStress = () => {
    const stressResult =
      readStorage(STORAGE_KEYS.stressResult);

    const stressData =
      readStorage(STORAGE_KEYS.stressData);

    const possibleRecords = [];

    if (stressResult) {
      possibleRecords.push(stressResult);
    }

    if (
      stressData &&
      JSON.stringify(stressData) !==
        JSON.stringify(stressResult)
    ) {
      possibleRecords.push(stressData);
    }

    const records = getWeeklyRecords(
      possibleRecords
    );

    if (records.length === 0) {
      return {
        score: null,
        level: "Not available",
        status: "Complete an assessment",
      };
    }

    const scores = records
      .map((record) => {
        const rawScore =
          record.stressScore ??
          record.score ??
          record.stress_score;

        let score = toNumber(rawScore);

        if (score === null) {
          return null;
        }

        // Support both 0–10 and 0–100 formats.
        if (score > 10 && score <= 100) {
          score = score / 10;
        }

        return Math.min(
          Math.max(score, 0),
          10
        );
      })
      .filter((score) => score !== null);

    if (scores.length === 0) {
      return {
        score: null,
        level: "Not available",
        status: "Complete an assessment",
      };
    }

    const average =
      scores.reduce(
        (sum, value) => sum + value,
        0
      ) / scores.length;

    let level = "Low";
    let status = "Well-managed";

    if (average >= 7) {
      level = "High";
      status = "Needs attention";
    } else if (average >= 4) {
      level = "Moderate";
      status = "Monitor regularly";
    }

    return {
      score:
        Math.round(average * 10) / 10,
      level,
      status,
    };
  };

  // ============================================================
  // MOOD DATA
  // ============================================================

  const calculateMood = () => {
    const moodHistory =
      getWeeklyRecords(
        readStorage(
          STORAGE_KEYS.moodHistory
        )
      );

    const moodData =
      readStorage(STORAGE_KEYS.moodData);

    let records = [...moodHistory];

    if (
      moodData &&
      !records.some(
        (record) =>
          JSON.stringify(record) ===
          JSON.stringify(moodData)
      )
    ) {
      records.push(moodData);
    }

    if (records.length === 0) {
      return {
        score: null,
        emotion: "Not available",
        entries: 0,
      };
    }

    const scores = records
      .map((record) =>
        toNumber(
          record.moodScore ??
            record.score ??
            record.mood_score
        )
      )
      .filter(
        (score) => score !== null
      );

    const average =
      scores.length > 0
        ? scores.reduce(
            (sum, value) => sum + value,
            0
          ) / scores.length
        : null;

    const latest =
      records[records.length - 1];

    return {
      score:
        average !== null
          ? Math.round(
              Math.min(
                Math.max(
                  average,
                  0
                ),
                100
              )
            )
          : null,

      emotion:
        latest?.emotion ||
        latest?.mood ||
        "Recorded",

      entries: records.length,
    };
  };

  // ============================================================
  // SLEEP DATA
  // ============================================================

  const calculateSleep = () => {
    const sleepHistory =
      getWeeklyRecords(
        readStorage(
          STORAGE_KEYS.sleepHistory
        )
      );

    const sleepData =
      readStorage(
        STORAGE_KEYS.sleepData
      );

    let records = [...sleepHistory];

    if (
      sleepData &&
      !records.some(
        (record) =>
          JSON.stringify(record) ===
          JSON.stringify(sleepData)
      )
    ) {
      records.push(sleepData);
    }

    if (records.length === 0) {
      return {
        duration: null,
        score: null,
        quality: null,
        entries: 0,
      };
    }

    const durations = records
      .map((record) =>
        toNumber(
          record.duration ??
            record.sleepDuration ??
            record.hours ??
            record.sleep_hours
        )
      )
      .filter(
        (value) => value !== null
      );

    const scores = records
      .map((record) =>
        toNumber(
          record.score ??
            record.sleepScore ??
            record.sleep_score
        )
      )
      .filter(
        (value) => value !== null
      );

    const qualities = records
      .map((record) =>
        toNumber(
          record.quality ??
            record.sleepQuality ??
            record.sleep_quality
        )
      )
      .filter(
        (value) => value !== null
      );

    const averageDuration =
      durations.length > 0
        ? durations.reduce(
            (sum, value) => sum + value,
            0
          ) / durations.length
        : null;

    const averageScore =
      scores.length > 0
        ? scores.reduce(
            (sum, value) => sum + value,
            0
          ) / scores.length
        : null;

    const averageQuality =
      qualities.length > 0
        ? qualities.reduce(
            (sum, value) => sum + value,
            0
          ) / qualities.length
        : null;

    return {
      duration:
        averageDuration !== null
          ? Math.round(
              averageDuration * 10
            ) / 10
          : null,

      score:
        averageScore !== null
          ? Math.round(
              Math.min(
                Math.max(
                  averageScore,
                  0
                ),
                100
              )
            )
          : null,

      quality:
        averageQuality !== null
          ? Math.round(
              averageQuality * 10
            ) / 10
          : null,

      entries: records.length,
    };
  };

  // ============================================================
  // NUTRITION DATA
  // ============================================================

  
  const calculateNutrition = () => {
    const nutritionHistory = getWeeklyRecords(
      readStorage(STORAGE_KEYS.nutritionHistory)
    ).filter(
      (record) =>
        record &&
        typeof record === "object" &&
        record.date
    );

    const nutritionData = readStorage(
      STORAGE_KEYS.nutritionData
    );

    const nutritionSummaries = Array.isArray(nutritionData)
      ? getWeeklyRecords(nutritionData)
      : nutritionData &&
          typeof nutritionData === "object" &&
          nutritionData.date
        ? [nutritionData]
        : [];

    const summaryRecords = nutritionSummaries.filter(
      (record) =>
        record &&
        typeof record === "object" &&
        !nutritionHistory.some(
          (entry) =>
            JSON.stringify(entry) === JSON.stringify(record)
        )
    );

    const getScore = (record) =>
      toNumber(
        record.quality ??
          record.dietQuality ??
          record.nutritionScore ??
          record.nutrition_score ??
          record.score
      );

    // Prefer genuine saved nutrition summary scores.
    const savedQualityValues = summaryRecords
      .map(getScore)
      .filter((value) => value !== null);

    let quality = null;

    if (savedQualityValues.length > 0) {
      quality = Math.round(
        Math.min(
          100,
          Math.max(
            0,
            savedQualityValues.reduce(
              (sum, value) => sum + value,
              0
            ) / savedQualityValues.length
          )
        )
      );
    } else if (nutritionHistory.length > 0) {
      // Group individual food entries by day.
      // These are baseline targets, not personalized targets.
      const dailyTotals = new Map();

      nutritionHistory.forEach((record) => {
        const date = String(record.date).slice(0, 10);

        if (!dailyTotals.has(date)) {
          dailyTotals.set(date, {
            calories: 0,
            protein: 0,
            fiber: 0,
            categories: new Set(),
          });
        }

        const day = dailyTotals.get(date);

        day.calories += Number(record.calories) || 0;
        day.protein += Number(record.protein) || 0;
        day.fiber += Number(record.fiber) || 0;

        if (record.category) {
          day.categories.add(record.category);
        }
      });

      const dailyScores = [...dailyTotals.values()].map((day) => {
        const calorieScore = Math.min(
          (day.calories / 2000) * 100,
          100
        );

        const proteinScore = Math.min(
          (day.protein / 80) * 100,
          100
        );

        const fiberScore = Math.min(
          (day.fiber / 30) * 100,
          100
        );

        const varietyScore = Math.min(
          day.categories.size * 20,
          100
        );

        // Hydration is reported separately below.
        return (
          calorieScore * 0.3 +
          proteinScore * 0.2 +
          fiberScore * 0.15 +
          varietyScore * 0.2
        ) / 0.85;
      });

      if (dailyScores.length > 0) {
        quality = Math.round(
          dailyScores.reduce((sum, score) => sum + score, 0) /
            dailyScores.length
        );
      }
    }

    // Hydration comes from the actual water history.
    const waterHistory = getWeeklyRecords(
      readStorage("mindnutri_water_history")
    ).filter(
      (record) =>
        record &&
        typeof record === "object" &&
        record.date
    );

    const hydrationByDate = new Map();

    waterHistory.forEach((record) => {
      const date = String(record.date).slice(0, 10);
      const glasses = toNumber(record.glasses);

      if (date && glasses !== null) {
        // Keep one latest-listed record per date.
        if (!hydrationByDate.has(date)) {
          hydrationByDate.set(date, Math.max(0, glasses));
        }
      }
    });

    const hydrationValues = [...hydrationByDate.values()];

    const hydration =
      hydrationValues.length > 0
        ? Math.round(
            Math.min(
              100,
              Math.max(
                0,
                hydrationValues.reduce(
                  (sum, glasses) =>
                    sum + (glasses / 8) * 100,
                  0
                ) / hydrationValues.length
              )
            )
          )
        : null;

    // Count distinct logged meal types per day, not each food item.
    const mealKeys = new Set();

    nutritionHistory.forEach((record) => {
      if (record.meal) {
        mealKeys.add(
          `${String(record.date).slice(0, 10)}|${record.meal}`
        );
      }
    });

    // Support older summary formats that store meal counts.
    let legacyMealCount = 0;

    summaryRecords.forEach((record) => {
      if (Array.isArray(record.meals)) {
        legacyMealCount += record.meals.length;
      } else if (Array.isArray(record.foods)) {
        legacyMealCount += record.foods.length;
      } else if (Array.isArray(record.entries)) {
        legacyMealCount += record.entries.length;
      } else {
        const count = toNumber(
          record.mealCount ??
            record.mealsLogged ??
            record.meals_count
        );

        if (count !== null) {
          legacyMealCount += count;
        }
      }
    });

    return {
      quality,
      hydration,
      meals: mealKeys.size + legacyMealCount,
      entries: nutritionHistory.length,
    };
  };


  // ============================================================
  // GOALS DATA
  // ============================================================

  const calculateGoals = () => {
    const savedGoals =
      readStorage(
        STORAGE_KEYS.goals
      );

    const savedCompletion =
      readStorage(
        STORAGE_KEYS.goalsCompletion
      );

    // ----------------------------------------------------------
    // No goals available
    // ----------------------------------------------------------

    if (
      !Array.isArray(savedGoals) ||
      savedGoals.length === 0
    ) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
      };
    }

    // ----------------------------------------------------------
    // Completion object
    // ----------------------------------------------------------

    const completion =
      savedCompletion &&
      typeof savedCompletion ===
        "object"
        ? savedCompletion
        : {};

    // ----------------------------------------------------------
    // Count completed goals
    //
    // Primary source:
    // mindnutri_daily_goals_completion
    //
    // Fallback:
    // goal.completed / goal.isCompleted
    // ----------------------------------------------------------

    const completedGoals =
      savedGoals.filter(
        (goal) =>
          completion[goal.id] === true ||
          goal.completed === true ||
          goal.isCompleted === true
      ).length;

    const percentage =
      savedGoals.length > 0
        ? Math.round(
            (completedGoals /
              savedGoals.length) *
              100
          )
        : 0;

    return {
      total: savedGoals.length,
      completed: completedGoals,
      percentage,
    };
  };

  // ============================================================
  // COMPOSITE WELLNESS SCORE
  // ============================================================

  const calculateCompositeScore = (
    stress,
    mood,
    sleep,
    nutrition
  ) => {
    const componentScores = [];

    // Stress → lower stress = better wellness.
    if (stress.score !== null) {
      const stressWellness =
        100 -
        stress.score * 10;

      componentScores.push(
        Math.min(
          Math.max(
            stressWellness,
            0
          ),
          100
        )
      );
    }

    // Mood.
    if (mood.score !== null) {
      componentScores.push(
        Math.min(
          Math.max(
            mood.score,
            0
          ),
          100
        )
      );
    }

    // Sleep.
    if (sleep.score !== null) {
      componentScores.push(
        Math.min(
          Math.max(
            sleep.score,
            0
          ),
          100
        )
      );
    } else if (
      sleep.duration !== null
    ) {
      const sleepWellness =
        Math.min(
          Math.max(
            (sleep.duration / 8) *
              100,
            0
          ),
          100
        );

      componentScores.push(
        sleepWellness
      );
    }

    // Nutrition.
    if (
      nutrition.quality !== null
    ) {
      componentScores.push(
        nutrition.quality
      );
    }

    // No data.
    if (
      componentScores.length === 0
    ) {
      return null;
    }

    const average =
      componentScores.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      componentScores.length;

    return Math.round(
      Math.min(
        Math.max(
          average,
          0
        ),
        100
      )
    );
  };

  // ============================================================
  // STATUS
  // ============================================================

  const getWellnessStatus = (
    score
  ) => {
    if (score === null) {
      return "Getting Started";
    }

    if (score >= 80) {
      return "Excellent Balance";
    }

    if (score >= 65) {
      return "Good Balance";
    }

    if (score >= 50) {
      return "Moderate Balance";
    }

    return "Needs Attention";
  };

  // ============================================================
  // GENERATE ACHIEVEMENTS
  // ============================================================

  const generateAchievements = (
    stress,
    mood,
    sleep,
    nutrition,
    goals
  ) => {
    const achievements = [];

    // ----------------------------------------------------------
    // SLEEP ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      sleep.duration !== null &&
      sleep.duration >= 7
    ) {
      achievements.push(
        `Maintained an average sleep duration of ${sleep.duration} hours.`
      );
    }

    // ----------------------------------------------------------
    // HYDRATION ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      nutrition.hydration !== null &&
      nutrition.hydration >= 80
    ) {
      achievements.push(
        `Maintained strong hydration adherence at ${nutrition.hydration}%.`
      );
    }

    // ----------------------------------------------------------
    // MOOD JOURNAL ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      mood.entries >= 3
    ) {
      achievements.push(
        `Stayed engaged with your mood journal across ${mood.entries} entries.`
      );
    }

    // ----------------------------------------------------------
    // NUTRITION ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      nutrition.meals >= 5
    ) {
      achievements.push(
        `Logged ${nutrition.meals} distinct meals during the available period.`
      );
    }

    // ----------------------------------------------------------
    // STRESS ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      stress.score !== null &&
      stress.score < 4
    ) {
      achievements.push(
        "Your recorded stress level remained in a lower range."
      );
    }

    // ----------------------------------------------------------
    // GOALS ACHIEVEMENT
    // ----------------------------------------------------------

    if (
      goals.completed > 0
    ) {
      achievements.push(
        `Completed ${goals.completed} planned wellness action${
          goals.completed > 1
            ? "s"
            : ""
        }.`
      );
    }

    // ----------------------------------------------------------
    // GOALS COMPLETE
    // ----------------------------------------------------------

    if (
      goals.total > 0 &&
      goals.completed === goals.total
    ) {
      achievements.push(
        "Completed your full personalized wellness plan."
      );
    }

    // ----------------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------------

    if (
      achievements.length === 0
    ) {
      achievements.push(
        "You started building your MindNutri wellness record this week."
      );

      achievements.push(
        "Regular check-ins will help create more meaningful weekly insights."
      );
    }

    return achievements.slice(
      0,
      4
    );
  };

  // ============================================================
  // GENERATE FOCUS AREAS
  // ============================================================

  const generateFocusAreas = (
    stress,
    mood,
    sleep,
    nutrition
  ) => {
    const focusAreas = [];

    // ----------------------------------------------------------
    // STRESS
    // ----------------------------------------------------------

    if (
      stress.score !== null &&
      stress.score >= 6
    ) {
      focusAreas.push(
        "Create a short daily relaxation or breathing break to support stress management."
      );
    }

    // ----------------------------------------------------------
    // SLEEP
    // ----------------------------------------------------------

    if (
      sleep.duration !== null &&
      sleep.duration < 7
    ) {
      focusAreas.push(
        "Work toward a more consistent sleep routine and 7–9 hours of sleep opportunity."
      );
    }

    // ----------------------------------------------------------
    // MOOD
    // ----------------------------------------------------------

    if (
      mood.score !== null &&
      mood.score < 50
    ) {
      focusAreas.push(
        "Continue gentle mood journaling and notice activities or situations that influence your mood."
      );
    }

    // ----------------------------------------------------------
    // HYDRATION
    // ----------------------------------------------------------

    if (
      nutrition.hydration !== null &&
      nutrition.hydration < 70
    ) {
      focusAreas.push(
        "Increase regular water intake throughout the day."
      );
    }

    // ----------------------------------------------------------
    // NUTRITION QUALITY
    // ----------------------------------------------------------

    if (
      nutrition.quality !== null &&
      nutrition.quality < 60
    ) {
      focusAreas.push(
        "Focus on more balanced meals and include a wider variety of nutrient-rich foods."
      );
    }

    // ----------------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------------

    if (
      focusAreas.length === 0
    ) {
      focusAreas.push(
        "Maintain your current healthy routines and keep recording your wellness data consistently."
      );

      focusAreas.push(
        "Choose one small habit to strengthen during the next 7 days."
      );
    }

    return focusAreas.slice(
      0,
      4
    );
  };

  // ============================================================
  // GENERATE 7-DAY PROTOCOL
  // ============================================================

  const generateProtocol = (
    stress,
    sleep,
    nutrition
  ) => {
    const actions = [];

    // ----------------------------------------------------------
    // SLEEP
    // ----------------------------------------------------------

    if (
      sleep.duration !== null &&
      sleep.duration < 7
    ) {
      actions.push(
        "Prioritize a consistent bedtime and create enough time for 7–9 hours of sleep."
      );
    } else {
      actions.push(
        "Maintain a consistent sleep and wake schedule throughout the week."
      );
    }

    // ----------------------------------------------------------
    // HYDRATION
    // ----------------------------------------------------------

    if (
      nutrition.hydration !== null &&
      nutrition.hydration < 80
    ) {
      actions.push(
        "Keep water accessible and build regular hydration reminders into your routine."
      );
    }

    // ----------------------------------------------------------
    // NUTRITION
    // ----------------------------------------------------------

    if (
      nutrition.quality !== null &&
      nutrition.quality < 70
    ) {
      actions.push(
        "Include vegetables, fruits, whole grains and protein-rich foods across your meals."
      );
    }

    // ----------------------------------------------------------
    // STRESS
    // ----------------------------------------------------------

    if (
      stress.score !== null &&
      stress.score >= 6
    ) {
      actions.push(
        "Schedule a short calming break each day for breathing, stretching or quiet reflection."
      );
    }

    // ----------------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------------

    if (
      actions.length === 0
    ) {
      actions.push(
        "Continue your current wellness habits and use MindNutri regularly to monitor changes."
      );
    }

    return actions.slice(
      0,
      3
    );
  };

  // ============================================================
  // BUILD REPORT
  // ============================================================

  const buildReport = () => {
    const stress =
      calculateStress();

    const mood =
      calculateMood();

    const sleep =
      calculateSleep();

    const nutrition =
      calculateNutrition();

    const goals =
      calculateGoals();

    const compositeScore =
      calculateCompositeScore(
        stress,
        mood,
        sleep,
        nutrition
      );

    return {
      stress,
      mood,
      sleep,
      nutrition,
      goals,

      compositeScore,

      status:
        getWellnessStatus(
          compositeScore
        ),

      achievements:
        generateAchievements(
          stress,
          mood,
          sleep,
          nutrition,
          goals
        ),

      focusAreas:
        generateFocusAreas(
          stress,
          mood,
          sleep,
          nutrition
        ),

      protocol:
        generateProtocol(
          stress,
          sleep,
          nutrition
        ),
    };
  };

  // ============================================================
  // LOAD REPORT
  // ============================================================

  useEffect(() => {
    const loadReport = () => {
      setReportData(
        buildReport()
      );
    };

    loadReport();

    // ----------------------------------------------------------
    // LocalStorage changes from other browser tabs/windows
    // ----------------------------------------------------------

    window.addEventListener(
      "storage",
      loadReport
    );

    // ----------------------------------------------------------
    // Refresh when user comes back to this page
    // ----------------------------------------------------------

    window.addEventListener(
      "focus",
      loadReport
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadReport
      );

      window.removeEventListener(
        "focus",
        loadReport
      );
    };
  }, []);

  // ============================================================
  // CURRENT DATE
  // ============================================================

  const currentDate =
    useMemo(() => {
      return new Date().toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    }, []);

  // ============================================================
  // REPORT PERIOD
  // ============================================================

  const reportPeriod =
    useMemo(() => {
      const end = new Date();

      const start = new Date(end);

      start.setDate(
        start.getDate() - 6
      );

      const formatDate = (
        date
      ) =>
        date.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        );

      return `${formatDate(
        start
      )} – ${formatDate(end)}`;
    }, []);

  // ============================================================
  // PRINT / PDF
  // ============================================================

  const handlePrint = () => {
    setIsPrinting(true);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    }, 100);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (!reportData) {
    return (
      <div className="weekly-report-page">
        <div className="report-loading">
          Loading your weekly wellness report...
        </div>
      </div>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const {
    stress,
    mood,
    sleep,
    nutrition,
    goals,
    compositeScore,
    status,
    achievements,
    focusAreas,
    protocol,
  } = reportData;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className={`weekly-report-page ${
        isPrinting
          ? "printing-report"
          : ""
      }`}
    >

      {/* ======================================================
          REPORT TOOLBAR
      ====================================================== */}

      <div className="report-toolbar">

        <div className="report-toolbar-left">

          <div className="report-toolbar-icon">
            📄
          </div>

          <div>
            <h2>
              Comprehensive Weekly Wellness Report
            </h2>

            <p>
              Automated multi-domain wellness summary
              based on your MindNutri records.
            </p>
          </div>

        </div>

        <div className="report-toolbar-actions">

          <button
            type="button"
            className="back-dashboard-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <button
            type="button"
            className="print-report-btn"
            onClick={handlePrint}
          >
            🖨️ Print / Export PDF
          </button>

        </div>

      </div>

      {/* ======================================================
          REPORT CONTAINER
      ====================================================== */}

      <main className="weekly-report-container">

        {/* ====================================================
            REPORT HEADER
        ==================================================== */}

        <section className="report-main-header">

          <div>

            <p className="report-eyebrow">
              MINDNUTRI HEALTH ANALYTICS ENGINE
            </p>

            <h1>
              Weekly Wellness Summary
            </h1>

            <p className="report-user-line">
              Weekly evaluation period:{" "}
              <strong>
                {reportPeriod}
              </strong>
            </p>

          </div>

          <div className="composite-score-box">

            <span>
              Weekly Composite Wellness
            </span>

            <strong>
              {compositeScore !== null
                ? compositeScore
                : "--"}

              <small>
                /100
              </small>
            </strong>

            <em>
              {status}
            </em>

          </div>

        </section>

        {/* ====================================================
            SUMMARY METRIC CARDS
        ==================================================== */}

        <section className="weekly-metrics-grid">

          {/* STRESS */}

          <div className="weekly-metric-card">

            <div className="metric-card-top">

              <span className="metric-icon">
                🧠
              </span>

              <span className="metric-label">
                Mental Stress
              </span>

            </div>

            <strong>
              {stress.score !== null
                ? `${stress.score} / 10`
                : "--"}
            </strong>

            <small>
              {stress.score !== null
                ? `${stress.level} / ${stress.status}`
                : "No assessment data"}
            </small>

          </div>

          {/* SLEEP */}

          <div className="weekly-metric-card">

            <div className="metric-card-top">

              <span className="metric-icon">
                🌙
              </span>

              <span className="metric-label">
                Sleep Score
              </span>

            </div>

            <strong>
              {sleep.duration !== null
                ? `${sleep.duration} hrs`
                : "--"}
            </strong>

            <small>
              {sleep.score !== null
                ? `Score: ${sleep.score}/100`
                : sleep.duration !== null
                ? "Average duration"
                : "No sleep data"}
            </small>

          </div>

          {/* NUTRITION */}

          <div className="weekly-metric-card">

            <div className="metric-card-top">

              <span className="metric-icon">
                🥗
              </span>

              <span className="metric-label">
                Diet Quality
              </span>

            </div>

            <strong>
              {nutrition.quality !== null
                ? `${nutrition.quality} / 100`
                : "--"}
            </strong>

            <small>
              {nutrition.quality !== null
                ? "Nutrition quality"
                : "No nutrition score"}
            </small>

          </div>

          {/* HYDRATION */}

          <div className="weekly-metric-card">

            <div className="metric-card-top">

              <span className="metric-icon">
                💧
              </span>

              <span className="metric-label">
                Hydration Adherence
              </span>

            </div>

            <strong>
              {nutrition.hydration !== null
                ? `${nutrition.hydration}%`
                : "--"}
            </strong>

            <small>
              {nutrition.hydration !== null
                ? "Weekly hydration indicator"
                : "No hydration data"}
            </small>

          </div>

        </section>

        {/* ====================================================
            GOALS PROGRESS
        ==================================================== */}

        {goals.total > 0 && (

          <section className="report-goals-summary">

            <div className="report-goals-summary-header">

              <div>

                <span className="report-section-label">
                  DAILY ACTION PLAN
                </span>

                <h2>
                  Personalized Goals Progress
                </h2>

              </div>

              <strong>
                {goals.percentage}%
              </strong>

            </div>

            <div className="report-goals-progress-track">

              <div
                className="report-goals-progress-fill"
                style={{
                  width: `${goals.percentage}%`,
                }}
              />

            </div>

            <p>
              {goals.completed} of{" "}
              {goals.total} personalized wellness
              actions completed.
            </p>

          </section>

        )}

        {/* ====================================================
            KEY ACHIEVEMENTS
            + FOCUS AREAS
        ==================================================== */}

        <section className="report-two-column">

          {/* ACHIEVEMENTS */}

          <div className="report-panel achievement-panel">

            <div className="panel-title">

              <span>
                ♧
              </span>

              <h2>
                Key Weekly Achievements
              </h2>

            </div>

            <ul>

              {achievements.map(
                (
                  achievement,
                  index
                ) => (
                  <li key={index}>

                    <span>
                      ✓
                    </span>

                    <p>
                      {achievement}
                    </p>

                  </li>
                )
              )}

            </ul>

          </div>

          {/* FOCUS AREAS */}

          <div className="report-panel focus-panel">

            <div className="panel-title">

              <span>
                ⚠
              </span>

              <h2>
                Focus Areas for Next Week
              </h2>

            </div>

            <ul>

              {focusAreas.map(
                (
                  focus,
                  index
                ) => (
                  <li key={index}>

                    <span>
                      •
                    </span>

                    <p>
                      {focus}
                    </p>

                  </li>
                )
              )}

            </ul>

          </div>

        </section>

        {/* ====================================================
            7-DAY RECOMMENDED PROTOCOL
        ==================================================== */}

        <section className="protocol-panel">

          <div className="protocol-heading">

            <span>
              ✣
            </span>

            <div>

              <h2>
                Recommended Protocol for Upcoming 7-Day Sprint
              </h2>

              <p>
                Personalized wellness actions based on
                the information currently available in
                MindNutri.
              </p>

            </div>

          </div>

          <div className="protocol-list">

            {protocol.map(
              (
                action,
                index
              ) => (
                <div
                  className="protocol-item"
                  key={index}
                >

                  <span>
                    {index + 1}
                  </span>

                  <p>
                    {action}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* ====================================================
            EDUCATIONAL NOTICE
        ==================================================== */}

        <div className="weekly-report-disclaimer">

          <span>
            ℹ️
          </span>

          <p>
            MindNutri provides educational wellness
            analytics, predictive estimates and
            lifestyle guidance. This weekly report is
            intended for general wellness support and
            is not a substitute for professional medical
            diagnosis or treatment.
          </p>

        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="weekly-report-footer">

          <span>
            MINDNUTRI
          </span>

          <p>
            B.Sc. Data Science Project • Local
            Analytics Pipeline • Educational Purpose Only
          </p>

          <small>
            Generated on {currentDate}
          </small>

        </footer>

      </main>

    </div>
  );
};

export default WeeklyWellnessReport;