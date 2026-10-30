import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

import "./WellnessAnalytics.css";

/*
============================================================
MINDNUTRI — WELLNESS ANALYTICS
Premium colourful analytics dashboard
Local Analytics Engine
No External API
============================================================
*/

const STORAGE_KEYS = {
  mood: "mindnutri_mood_history",
  stress: "mindnutri_stress_result",
  sleepHistory: "mindnutri_sleep_history",
  nutrition: "mindnutri_nutrition_history",
  water: "mindnutri_water",
};

const TARGETS = {
  water: 8,
  sleep: 8,
};

/*
============================================================
STORAGE HELPERS
============================================================
*/

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

/*
============================================================
DATE HELPERS
============================================================
*/

function getDateKey(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysAgo(days) {
  const date = new Date();

  date.setDate(
    date.getDate() - days
  );

  return getDateKey(date);
}

function normalizeDate(entry) {
  if (!entry) {
    return null;
  }

  if (entry.timestamp) {
    const date = new Date(
      entry.timestamp
    );

    if (!Number.isNaN(date.getTime())) {
      return getDateKey(date);
    }
  }

  if (entry.date) {
    const date = new Date(
      entry.date
    );

    if (!Number.isNaN(date.getTime())) {
      return getDateKey(date);
    }

    return entry.date;
  }

  return null;
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

/*
============================================================
AVERAGE
============================================================
*/

function average(values) {
  const valid = values
    .map(Number)
    .filter((value) =>
      Number.isFinite(value)
    );

  if (!valid.length) {
    return null;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / valid.length
  );
}

/*
============================================================
MAIN COMPONENT
============================================================
*/

function WellnessAnalytics() {
  const navigate = useNavigate();

  const [selectedPeriod, setSelectedPeriod] =
    useState(7);

  const [dataVersion, setDataVersion] =
    useState(0);

  /*
  ============================================================
  LOAD LOCAL DATA
  ============================================================
  */

  const wellnessData = useMemo(() => {
    const moodHistory =
      readStorage(
        STORAGE_KEYS.mood,
        []
      ) || [];

    const stressResult =
      readStorage(
        STORAGE_KEYS.stress
      );

    const stressHistory = 
      readStorage( 
        "mindnutri_stress_history",
        [] 
      ) || [];

    const sleepHistory =
      readStorage(
        STORAGE_KEYS.sleepHistory,
        []
      ) || [];

    const nutritionHistory =
      readStorage(
        STORAGE_KEYS.nutrition,
        []
      ) || [];

    const rawWater =
      localStorage.getItem(
        STORAGE_KEYS.water
      );

    const water = Number(
      rawWater || 0
    );

    const waterHistory =
      readStorage(
        "mindnutri_water_history",
        []
      ) || [];

    return {
      moodHistory:
        Array.isArray(moodHistory)
          ? moodHistory
          : [],

      stressResult,

      stressHistory:
        Array.isArray(stressHistory)
          ? stressHistory
          : [],

      sleepHistory:
        Array.isArray(sleepHistory)
          ? sleepHistory
          : [],

      nutritionHistory:
        Array.isArray(nutritionHistory)
          ? nutritionHistory
          : [],

      water:
        Number.isFinite(water)
          ? Math.max(
              0,
              Math.min(
                TARGETS.water,
                water
              )
            )
          : 0,
      waterHistory:
        Array.isArray(waterHistory)
          ? waterHistory
          : [],
    };
  }, [dataVersion]);

  /*
  ============================================================
  REFRESH
  ============================================================
  */

  useEffect(() => {
    const refresh = () => {
      setDataVersion(
        (value) => value + 1
      );
    };

    window.addEventListener(
      "storage",
      refresh
    );

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      window.removeEventListener(
        "storage",
        refresh
      );

      window.removeEventListener(
        "focus",
        refresh
      );
    };
  }, []);

  /*
  ============================================================
  RECENT MOOD
  ============================================================
  */

  const recentMood = useMemo(() => {
    const cutoff =
      getDaysAgo(selectedPeriod);

    return wellnessData.moodHistory.filter(
      (entry) => {
        const date =
          normalizeDate(entry);

        return (
          date &&
          date >= cutoff
        );
      }
    );
  }, [
    wellnessData.moodHistory,
    selectedPeriod,
  ]);

  /*
  ============================================================
  RECENT SLEEP
  ============================================================
  */

  const recentSleep = useMemo(() => {
    const cutoff =
      getDaysAgo(selectedPeriod);

    return wellnessData.sleepHistory.filter(
      (entry) => {
        const date =
          normalizeDate(entry);

        return (
          date &&
          date >= cutoff
        );
      }
    );
  }, [
    wellnessData.sleepHistory,
    selectedPeriod,
  ]);

  /*
  ============================================================
  RECENT NUTRITION
  ============================================================
  */
  
  const recentNutrition = useMemo(() => {
    const cutoff = getDaysAgo(selectedPeriod);

    return wellnessData.nutritionHistory.filter((entry) => {
      const date = normalizeDate(entry);
      return date && date >= cutoff;
    });
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
    return average(
      recentMood.map(
        (entry) =>
          Number(
            entry.moodScore
          )
      )
    );
  }, [recentMood]);

  /*
  ============================================================
  STRESS SCORE
  ============================================================
  */
  const recentStress = useMemo(() => {
    const cutoff = getDaysAgo(selectedPeriod);

    return (wellnessData.stressHistory || []).filter((entry) => {
      const date = normalizeDate(entry);

      return date && date >= cutoff;
    });
  }, [
    wellnessData.stressHistory,
    selectedPeriod,
  ]);

  const stressScore = useMemo(() => {
    const latestScore = Number(
      wellnessData.stressResult?.stressScore
    );

    if (Number.isFinite(latestScore)) {
      return Math.round(
        Math.min(Math.max((latestScore / 10) * 100, 0), 100)
      );
    }

    const sortedHistory = [...(wellnessData.stressHistory || [])]
      .sort((a, b) => {
        const dateA = new Date(
          a?.timestamp || a?.date || 0
        ).getTime();

        const dateB = new Date(
          b?.timestamp || b?.date || 0
        ).getTime();

        return dateB - dateA;
      });

    const fallbackScore = Number(
      sortedHistory[0]?.stressScore
    );

    if (!Number.isFinite(fallbackScore)) {
      return null;
    }

    return Math.round(
      Math.min(Math.max((fallbackScore / 10) * 100, 0), 100)
    );
  }, [wellnessData.stressResult, wellnessData.stressHistory]);

  /*
  ============================================================
  STRESS HISTORY & TREND
  ============================================================
  */

  const stressHistory =
    wellnessData.stressHistory || [];

  const stressTrend = useMemo(() => {
    if (stressHistory.length < 2) {
      return {
        text: "→ No previous data",
        color: "#8a7b8d",
      };
    }

    const current =
      Number(
        stressHistory[
          stressHistory.length - 1
        ]?.stressScore || 0
      );

    const previous =
      Number(
        stressHistory[
          stressHistory.length - 2
        ]?.stressScore || 0
      );

    const difference =
      current - previous;

    if (difference < -0.2) {
      return {
        text: "↓ Improving",
        color: "#27a56a",
      };
    }

    if (difference > 0.2) {
      return {
        text: "↑ Increasing",
        color: "#e05a67",
      };
    }

    return {
      text: "→ Stable",
      color: "#8a7b8d",
    };
  }, [stressHistory]);

  const last7StressEntries =
    useMemo(() => {
      return stressHistory.filter(
        (entry) => {
          if (!entry?.timestamp) {
            return false;
          }

          const entryDate =
            new Date(entry.timestamp);

          const now = new Date();

          const diffInDays =
            (now - entryDate) /
            (1000 * 60 * 60 * 24);

          return (
            diffInDays <= 7 &&
            diffInDays >= 0
          );
        }
      );
    }, [stressHistory]);

  const last7StressAverage =
    useMemo(() => {
      if (
        last7StressEntries.length > 0
      ) {
        return (
          last7StressEntries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.stressScore || 0
              ),
            0
          ) /
          last7StressEntries.length
        );
      }

      return Number(
        stressScore || 0
      ) / 10;
    }, [
      last7StressEntries,
      stressScore,
    ]);

  /*
  ============================================================
  SLEEP SCORE
  ============================================================
  */

  const sleepScore = useMemo(() => {
    return average(
      recentSleep.map(
        (entry) =>
          Number(entry.score)
      )
    );
  }, [recentSleep]);

  const getSleepHours = (entry) => {
    if (!entry) {
      return 0;
    }

    /*
    ============================================================
    FIRST: CALCULATE FROM SLEEP TIME + WAKE TIME
    This is the most reliable source.
    ============================================================
    */

    if (
      entry.sleepTime &&
      entry.wakeTime
    ) {
      const sleep = new Date(
        `2000-01-01T${entry.sleepTime}`
      );

      const wake = new Date(
        `2000-01-01T${entry.wakeTime}`
      );

      if (
        !Number.isNaN(
          sleep.getTime()
        ) &&
        !Number.isNaN(
          wake.getTime()
        )
      ) {
        if (wake <= sleep) {
          wake.setDate(
            wake.getDate() + 1
          );
        }

        const hours =
          (wake - sleep) /
          (1000 * 60 * 60);

        if (
          Number.isFinite(hours) &&
          hours > 0 &&
          hours <= 24
        ) {
          return hours;
        }
      }
    }

    /*
    ============================================================
    FALLBACK: USE STORED DURATION
    ============================================================
    */

    const numericValue =
      Number(entry.duration);

    if (
      Number.isFinite(
        numericValue
      ) &&
      numericValue > 0 &&
      numericValue <= 24
    ) {
      return numericValue;
    }

    return 0;
  };

  /*
  ============================================================
  AVERAGE SLEEP
  ============================================================
  */

  const averageSleep = useMemo(() => {
    const values = recentSleep
      .map((entry) =>
        getSleepHours(entry)
      )
      .filter((value) =>
        Number.isFinite(value) &&
        value > 0
      );

    if (!values.length) {
      return null;
    }

    return (
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length
    );
  }, [recentSleep]);

  const latestSleepEntry =
    Array.isArray(recentSleep) && recentSleep.length > 0
      ? [...recentSleep].sort((a, b) => {
          const aTime = new Date(
            a?.timestamp || a?.date || 0
          ).getTime();

          const bTime = new Date(
            b?.timestamp || b?.date || 0
          ).getTime();

          return bTime - aTime;
        })[0]
      : null;

  const latestSleepHours = latestSleepEntry
    ? getSleepHours(latestSleepEntry)
    : 0;

  const averageSleepScore =
    averageSleep !== null
      ? Math.min(
          Math.round(
            (averageSleep / TARGETS.sleep) * 100
          ),
          100
        )
      : 0;

  /*
  ============================================================
  NUTRITION SCORE
  ============================================================
  */

  const nutritionScore =
    useMemo(() => {
      if (!recentNutrition.length) {
        return null;
      }

      const calories =
        recentNutrition.reduce(
          (sum, item) =>
            sum +
            Number(
              item.calories || 0
            ),
          0
        );

      const protein =
        recentNutrition.reduce(
          (sum, item) =>
            sum +
            Number(
              item.protein || 0
            ),
          0
        );

      const fiber =
        recentNutrition.reduce(
          (sum, item) =>
            sum +
            Number(
              item.fiber || 0
            ),
          0
        );

      const calorieScore =
        calories <= 2000
          ? (calories / 2000) * 100
          : Math.max(
              0,
              100 -
                ((calories -
                  2000) /
                  2000) *
                  100
            );

      const proteinScore =
        Math.min(
          (protein / 80) * 100,
          100
        );

      const fiberScore =
        Math.min(
          (fiber / 30) * 100,
          100
        );

      const waterScore =
        Math.min(
          (wellnessData.water /
            TARGETS.water) *
            100,
          100
        );

      return Math.round(
        calorieScore * 0.3 +
          proteinScore * 0.3 +
          fiberScore * 0.25 +
          waterScore * 0.15
      );
    }, [
      recentNutrition,
      wellnessData.water,
    ]);

  /*
  ============================================================
  MOOD — BAR CHART DATA
  ============================================================
  */

  const moodChartData =
    useMemo(() => {
      const dailyMoodScores = new Map();

      recentMood.forEach((entry) => {
        const date = normalizeDate(entry);
        const mood = Number(entry.moodScore);

        if (
          !date ||
          entry.moodScore === null ||
          entry.moodScore === undefined ||
          entry.moodScore === "" ||
          !Number.isFinite(mood)
        ) {
          return;
        }

        if (!dailyMoodScores.has(date)) {
          dailyMoodScores.set(date, []);
        }

        dailyMoodScores.get(date).push(mood);
      });

      return Array.from(dailyMoodScores.entries())
        .map(([date, scores]) => ({
          date,
          label: formatDate(date),
          mood: Number(
            (
              scores.reduce((sum, score) => sum + score, 0) /
              scores.length
            ).toFixed(2)
          ),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }, [recentMood]);


  /*
  ============================================================
  SLEEP — SCREENSHOT STYLE DATA
  ============================================================
  */
  console.log("RECENT SLEEP DATA:", recentSleep);
  console.log("RECENT SLEEP LENGTH:", recentSleep.length);  

  const sleepChartData =
    useMemo(() => {
      return [...recentSleep]
        .map((entry) => {
          const date =
            normalizeDate(entry);

          return {
            date,
            label:
              formatDate(date),
            sleep: 
              getSleepHours(entry),
            target: 
              TARGETS.sleep,
          };
        })
        .filter((item) =>
          Number.isFinite(
            item.sleep
          )
        )
        .sort((a, b) =>
          a.date.localeCompare(
            b.date
          )
        );
    }, [recentSleep]);

  /* ============================================================
    NUTRITION — DAILY CHART DATA
  ============================================================ */

  const nutritionChartData =
    useMemo(() => {

      const dailyData = {};

      recentNutrition.forEach(
        (entry) => {

          const date =
            normalizeDate(entry);

          if (!date) {
            return;
          }

          if (!dailyData[date]) {

            dailyData[date] = {
              date,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
            };

          }

          dailyData[date].calories +=
            Number(
              entry.calories || 0
            );

          dailyData[date].protein +=
            Number(
              entry.protein || 0
            );

          dailyData[date].carbs +=
            Number(
              entry.carbs ??
              entry.carbohydrates ??
              entry.carbohydrate ??
              0
            );

          dailyData[date].fats +=
            Number(
              entry.fats ??
              entry.fat ??
              entry.healthyFat ??
              0
            );

        }
      );

      return Object.values(
        dailyData
      )
        .map((item) => ({

          ...item,

          label:
            formatDate(
              item.date
            ),

        }))
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        );

    }, [recentNutrition]);

  /*
  ============================================================
  NUTRITION TOTALS
  ============================================================
  */

  const totalCalories =
    useMemo(() => {
      return recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.calories || 0
          ),
        0
      );
    }, [recentNutrition]);

  const totalProtein =
    useMemo(() => {
      return recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.protein || 0
          ),
        0
      );
    }, [recentNutrition]);

  const totalFiber =
    useMemo(() => {
      return recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.fiber || 0
          ),
        0
      );
    }, [recentNutrition]);

  /* ============================================================
    WELLNESS TRENDS — REAL DATA
    No fake values
  ============================================================ */

  const wellnessTrendData = useMemo(() => {
    const daily = {};

    const ensureDay = (date) => {
      if (!date) {
        return null;
      }

      if (!daily[date]) {
        daily[date] = {
          date,
          label: formatDate(date),
        };
      }

      return daily[date];
    };

    /*
    ============================================================
    MENTAL / MOOD
    ============================================================
    */

    recentMood.forEach((entry) => {
      const date = normalizeDate(entry);
      const mood = Number(entry.moodScore);

      if (
        date &&
        Number.isFinite(mood)
      ) {
        const day = ensureDay(date);

        day.mental = Math.max(
          0,
          Math.min(100, mood)
        );
      }
    });

    /*
    ============================================================
    STRESS
    ============================================================
    */

    recentStress.forEach(
      (entry) => {
        const rawStress = Number(
          entry?.stressScore
        );

        if (
          !Number.isFinite(rawStress)
        ) {
          return;
        }

        const date =
          normalizeDate(entry);

        if (!date) {
          return;
        }

        const day = ensureDay(date);

        day.stress = Math.max(
          0,
          Math.min(
            100,
            (rawStress / 10) * 100
          )
        );
      }
    );

    /*
    ============================================================
    SLEEP
    ============================================================
    */

    recentSleep.forEach((entry) => {
      const date = normalizeDate(entry);

      const sleepScoreValue =
        Number(entry.score);

      if (
        date &&
        Number.isFinite(
          sleepScoreValue
        )
      ) {
        const day = ensureDay(date);

        day.sleep = Math.max(
          0,
          Math.min(
            100,
            sleepScoreValue
          )
        );
      }
    });

    /*
    ============================================================
    NUTRITION
    DAILY ACTUAL NUTRITION SCORE
    ============================================================
    */

    const nutritionByDay = {};

    recentNutrition.forEach(
      (entry) => {
        const date =
          normalizeDate(entry);

        if (!date) {
          return;
        }

        if (!nutritionByDay[date]) {
          nutritionByDay[date] = {
            calories: 0,
            protein: 0,
            fiber: 0,
          };
        }

        nutritionByDay[date].calories +=
          Number(
            entry.calories || 0
          );

        nutritionByDay[date].protein +=
          Number(
            entry.protein || 0
          );

        nutritionByDay[date].fiber +=
          Number(
            entry.fiber || 0
          );
      }
    );

    Object.entries(
      nutritionByDay
    ).forEach(
      ([date, values]) => {
        const calorieScore =
          values.calories <= 2000
            ? (values.calories / 2000) *
              100
            : Math.max(
                0,
                100 -
                  ((values.calories -
                    2000) /
                    2000) *
                    100
              );

        const proteinScore =
          Math.min(
            (values.protein / 80) *
              100,
            100
          );

        const fiberScore =
          Math.min(
            (values.fiber / 30) *
              100,
            100
          );

        const nutritionScore =
          calorieScore * 0.4 +
          proteinScore * 0.35 +
          fiberScore * 0.25;

        const day =
          ensureDay(date);

        day.nutrition =
          Math.round(
            nutritionScore
          );
      }
    );

    /*
    ============================================================
    HYDRATION
    ACTUAL DATE-WISE WATER HISTORY
    ============================================================
    */

    const waterHistory =
      Array.isArray(
        wellnessData.waterHistory
      )
        ? wellnessData.waterHistory
        : [];

    waterHistory.forEach(
      (entry) => {
        const date =
          normalizeDate(entry);

        const glasses = Number(
          entry?.glasses
        );

        if (
          !date ||
          !Number.isFinite(glasses)
        ) {
          return;
        }

        const day =
          ensureDay(date);

        day.hydration =
          Math.min(
            100,
            Math.round(
              (Math.max(
                0,
                glasses
              ) /
                TARGETS.water) *
                100
            )
          );
      }
    );

    /*
    ============================================================
    COMMON DATE AXIS
    ============================================================
    */
    console.log(
      "FINAL WELLNESS TREND DATA:",
      daily
    );

    return Object.values(daily)
      .sort((a, b) =>
        a.date.localeCompare(
          b.date
        )
      );
  }, [
    recentMood,
    recentSleep,
    recentNutrition,
    recentStress,
    wellnessData.stressHistory,
    wellnessData.waterHistory,
  ]);

  /*
  ============================================================
  MACRONUTRIENT DATA
  ============================================================
  */

  const macroData = useMemo(() => {
    const totalCarbs =
      recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.carbs ??
            item.carbohydrates ??
            item.carbohydrate ??
            0
          ),
        0
      );

    const totalProteinMacro =
      recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.protein || 0
          ),
        0
      );

    const totalFats =
      recentNutrition.reduce(
        (sum, item) =>
          sum +
          Number(
            item.fats ??
            item.fat ??
            item.healthyFat ??
            0
          ),
        0
      );

    const carbCalories =
      totalCarbs * 4;

    const proteinCalories =
      totalProteinMacro * 4;

    const fatCalories =
      totalFats * 9;

    const totalEnergy =
      carbCalories +
      proteinCalories +
      fatCalories;

    const carbPercentage =
      totalEnergy > 0
        ? Math.round(
            (carbCalories /
              totalEnergy) *
              100
          )
        : 0;

    const proteinPercentage =
      totalEnergy > 0
        ? Math.round(
            (proteinCalories /
              totalEnergy) *
              100
          )
        : 0;

    const fatPercentage =
      totalEnergy > 0
        ? Math.round(
            (fatCalories /
              totalEnergy) *
              100
          )
        : 0;
    console.log("MACRO DEBUG:", {
      selectedPeriod,
      records: recentNutrition.length,
      totalCarbs,
      totalProteinMacro,
      totalFats,
      carbPercentage,
      proteinPercentage,
      fatPercentage,
    });

    return {
      totalCarbs,
      totalProteinMacro,
      totalFats,
      carbPercentage,
      proteinPercentage,
      fatPercentage,
    };
  }, [recentNutrition]);

  /*
  ============================================================
  HYDRATION DATA
  ============================================================
  */

  const hydrationChartData =
    useMemo(() => {
      const water =
        wellnessData.water;

      const remaining =
        Math.max(
          TARGETS.water -
            water,
          0
        );

      return [
        {
          name: "Completed",
          value: water,
        },
        {
          name: "Remaining",
          value: remaining,
        },
      ];
    }, [
      wellnessData.water,
    ]);

  /*
  ============================================================
  STRESS RADIAL DATA
  ============================================================
  */

  const stressRadialData =
    useMemo(() => {
      if (
        stressScore === null
      ) {
        return [];
      }

      return [
        {
          name: "Stress",
          value: stressScore,
          fill: "#f05f6d",
        },
      ];
    }, [stressScore]);

  /*
  ============================================================
  COVERAGE
  ============================================================
  */

  const trackedAreas = [
    moodScore !== null,
    stressScore !== null,
    sleepScore !== null,
    nutritionScore !== null,
    wellnessData.water > 0,
  ].filter(Boolean).length;

  const coverage = Math.round(
    (trackedAreas / 5) * 100
  );

  /*
  ============================================================
  HYDRATION %
  ============================================================
  */

  const hydrationPercentage =
    Math.min(
      100,
      Math.round(
        (wellnessData.water /
          TARGETS.water) *
          100
      )
    );

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="analytics-page">

      <main className="analytics-main">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="analytics-header">

          <div>

            <p className="analytics-eyebrow">
              MINDNUTRI • WELLNESS ANALYTICS
            </p>

            <h1>
              See Your Wellness Clearly 📊
            </h1>

            <p className="analytics-subtitle">
              Explore your mood, stress,
              sleep, nutrition and
              hydration patterns using
              your recorded wellness data.
            </p>

          </div>
          <div className="analytics-back analytics-header-back">
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

        {/* ==================================================
            TOOLBAR
        ================================================== */}

        <div className="analytics-toolbar">

          <div>

            <span className="analytics-toolbar-label">
              ANALYSIS PERIOD
            </span>

            <div className="analytics-periods">

              {[7, 14, 30].map(
                (days) => (
                  <button
                    key={days}
                    type="button"
                    className={
                      selectedPeriod ===
                      days
                        ? "analytics-period active"
                        : "analytics-period"
                    }
                    onClick={() =>
                      setSelectedPeriod(
                        days
                      )
                    }
                  >
                    {days} Days
                  </button>
                )
              )}

            </div>

          </div>

          <button
            type="button"
            className="analytics-refresh"
            onClick={() =>
              setDataVersion(
                (value) =>
                  value + 1
              )
            }
          >
            ↻ Refresh Analytics
          </button>

        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="analytics-summary">

          <div className="analytics-summary-card mood-summary">

            <span>😊</span>

            <div>

              <small>
                MOOD
              </small>

              <strong>
                {moodScore !== null
                  ? `${Math.round(
                      moodScore
                    )}/100`
                  : "—"}
              </strong>

            </div>

          </div>

          <div className="analytics-summary-card stress-summary">

            <span>🧠</span>

            <div>

              <small>
                STRESS
              </small>

              <strong>
                {stressScore !== null
                  ? `${stressScore}/100`
                  : "—"}
              </strong>

            </div>

          </div>

          <div className="analytics-summary-card sleep-summary">

            <span>🌙</span>

            <div>

              <small>
                SLEEP
              </small>

              <strong>
                {sleepScore !== null
                  ? `${Math.round(
                      sleepScore
                    )}/100`
                  : "—"}
              </strong>

            </div>

          </div>

          <div className="analytics-summary-card nutrition-summary">

            <span>🥗</span>

            <div>

              <small>
                NUTRITION
              </small>

              <strong>
                {nutritionScore !== null
                  ? `${nutritionScore}/100`
                  : "—"}
              </strong>

            </div>

          </div>

          <div className="analytics-summary-card hydration-summary">

            <span>💧</span>

            <div>

              <small>
                HYDRATION
              </small>

              <strong>
                {wellnessData.water}

                <small className="inline-unit">
                  /8 glasses
                </small>

              </strong>

            </div>

          </div>

        </section>

        {/* ==================================================
            COVERAGE
        ================================================== */}

        <section className="analytics-coverage">

          <div>

            <p className="analytics-eyebrow">
              DATA COVERAGE
            </p>

            <h2>
              Your wellness history is{" "}
              {coverage}% ready for
              analysis
            </h2>

            <p>
              The more consistently
              you track, the more useful
              your trends become.
            </p>

          </div>

          <div className="coverage-progress-area">

            <strong>
              {coverage}%
            </strong>

            <div className="coverage-progress">

              <div
                style={{
                  width: `${coverage}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* ==================================================
            TOP ANALYTICS ROW
            MOOD + STRESS + SLEEP
        ================================================== */}

        <div className="analytics-top-row">

          {/* ==================================================
              MOOD — ROUNDED BAR CHART
          ================================================== */}

          <section className="analytics-section">

            <div className="analytics-section-heading">

              <div>

                <p className="analytics-eyebrow mood-eyebrow">
                  MOOD ANALYTICS
                </p>

                <h2>
                  Your mood journey
                </h2>

                <p>
                  See how your recorded mood
                  scores have moved over time.
                </p>

              </div>

              <span className="analytics-count mood-count">
                {recentMood.length} check-ins
              </span>

            </div>

            <div className="analytics-chart-card mood-chart-card">

              {moodChartData.length >= 1 ? (

                <ResponsiveContainer
                  width="100%"
                  height={240}
                >

                  <BarChart
                    data={moodChartData}
                    margin={{
                      top: 12,
                      right: 10,
                      left: 0,
                      bottom: 4,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 5"
                      stroke="#eee8fa"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 10,
                        fill: "#8d829e",
                      }}
                      axisLine={false}
                      tickLine={false}
                      height={24}
                    />

                    <YAxis
                      domain={[0, 100]}
                      ticks={[
                        0,
                        20,
                        40,
                        60,
                        80,
                        100,
                      ]}
                      tick={{
                        fontSize: 10,
                        fill: "#8d829e",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      cursor={{
                        fill:
                          "rgba(139,108,246,0.06)",
                      }}
                      contentStyle={{
                        borderRadius: 14,
                        border:
                          "1px solid #e5dcf7",
                        boxShadow:
                          "0 10px 30px rgba(105,75,150,0.12)",
                      }}
                      formatter={(value) => [
                        `${value}/100`,
                        "Mood Score",
                      ]}
                    />

                    <Bar
                      dataKey="mood"
                      name="Mood Score"
                      radius={[
                        8,
                        8,
                        3,
                        3,
                      ]}
                      maxBarSize={34}
                      label={{
                        position: "top",
                        fill: "#59627a",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {moodChartData.map(
                        (entry, index) => {
                          const moodColors = [
                            "#f6b73c",
                            "#f59b57",
                            "#d96b8a",
                            "#9b59d6",
                            "#8b5cf6",
                            "#a46ee8",
                            "#ef6f9a",
                          ];

                          return (
                            <Cell
                              key={`mood-cell-${index}`}
                              fill={
                                moodColors[
                                  index %
                                    moodColors.length
                                ]
                              }
                            />
                          );
                        }
                      )}
                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="analytics-empty-chart mood-empty">

                  <span>😊</span>

                  <h3>
                    No mood data yet
                  </h3>

                  <p>
                    Add mood journal entries
                    to see your mood analytics.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/mood-journal"
                      )
                    }
                  >
                    Open Mood Journal →
                  </button>

                </div>

              )}

            </div>

          </section>

          {/* ==================================================
              STRESS — RADIAL
          ================================================== */}

          <section className="analytics-section">

            <div className="analytics-section-heading">

              <div>

                <p className="analytics-eyebrow stress-eyebrow">
                  STRESS ANALYTICS
                </p>

                <h2>
                  Your current stress level
                </h2>

                <p>
                  A circular view of your
                  latest stress assessment.
                </p>

              </div>

            </div>

            <div
              className="stress-radial-card"
              style={{
                width: "100%",
                minHeight: "270px",
                padding: "18px 20px",
                boxSizing: "border-box",
                display: "grid",
                gridTemplateColumns: "200px minmax(0, 1fr)",
                alignItems: "center",
                gap: "22px",
                overflow: "hidden",
                position: "relative",
                borderRadius: "22px",
                border: "1px solid rgba(240, 95, 109, 0.20)",
                background:
                  "linear-gradient(135deg, #fffafb 0%, #fff5f6 55%, #ffffff 100%)",
                boxShadow:
                  "0 14px 35px rgba(75, 35, 45, 0.07)",
              }}
            >
              {stressScore !== null ? (
                <>
                  {/* ==================================================
                      SOFT BACKGROUND GLOW
                  ================================================== */}

                  <div
                    style={{
                      position: "absolute",
                      width: "170px",
                      height: "170px",
                      borderRadius: "50%",
                      background:
                        "rgba(240, 95, 109, 0.07)",
                      filter: "blur(30px)",
                      left: "30px",
                      top: "45px",
                      pointerEvents: "none",
                    }}
                  />

                  {/* ==================================================
                      SCORE CIRCLE
                  ================================================== */}

                  <div
                    className="stress-radial-chart"
                    style={{
                      width: "195px",
                      height: "195px",
                      position: "relative",
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <RadialBarChart
                        innerRadius="68%"
                        outerRadius="93%"
                        startAngle={90}
                        endAngle={-270}
                        data={stressRadialData}
                        barSize={22}
                        cx="50%"
                        cy="50%"
                      >
                        <defs>
                          <linearGradient
                            id="stressGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ff7d88"
                            />

                            <stop
                              offset="50%"
                              stopColor="#f05f6d"
                            />

                            <stop
                              offset="100%"
                              stopColor="#db4357"
                            />
                          </linearGradient>
                        </defs>

                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          tick={false}
                        />

                        <RadialBar
                          background={{
                            fill: "#f8e9eb",
                          }}
                          dataKey="value"
                          cornerRadius={16}
                          fill="url(#stressGradient)"
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>

                    {/* CENTER CONTENT */}

                    <div
                      className="stress-radial-center"
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "38px",
                          lineHeight: "1",
                          fontWeight: 800,
                          color: "#e94f61",
                          letterSpacing: "-1px",
                        }}
                      >
                        {stressScore}
                      </strong>

                      <span
                        style={{
                          marginTop: "5px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#9a777e",
                        }}
                      >
                        /100
                      </span>

                      <small
                        style={{
                          marginTop: "4px",
                          fontSize: "9px",
                          fontWeight: 800,
                          letterSpacing: "2px",
                          color: "#c34b5c",
                        }}
                      >
                        STRESS
                      </small>
                    </div>
                  </div>

                  {/* ==================================================
                      RIGHT INFORMATION
                  ================================================== */}

                  <div
                    className="stress-radial-info"
                    style={{
                      width: "100%",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      justifyContent: "center",
                      gap: "8px",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {/* TOP LABEL */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: "28px",
                            height: "28px",
                            minWidth: "28px",
                            borderRadius: "9px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "rgba(240, 95, 109, 0.11)",
                            fontSize: "14px",
                          }}
                        >
                          🧠
                        </span>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "9px",
                            lineHeight: "1.2",
                            fontWeight: 800,
                            letterSpacing: "1.2px",
                            color: "#c04c5d",
                          }}
                        >
                          CURRENT
                          <br />
                          STRESS SCORE
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "5px 8px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          fontSize: "9px",
                          fontWeight: 800,
                          color: "#d94d5e",
                          background:
                            "rgba(240, 95, 109, 0.10)",
                        }}
                      >
                        {stressScore}/100
                      </span>
                    </div>

                    {/* STATUS */}

                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          lineHeight: "1.1",
                          fontWeight: 800,
                          color: "#173d47",
                        }}
                      >
                        {wellnessData
                          .stressResult
                          ?.prediction ||
                          "Latest Assessment"}
                      </h3>

                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "10px",
                          lineHeight: "1.3",
                          color: "#927980",
                        }}
                      >
                        Based on your latest
                        stress assessment
                      </p>
                    </div>

                    {/* RETAKE BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/stress-assessment"
                        )
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        border: "none",
                        borderRadius: "11px",
                        background:
                          "linear-gradient(135deg, #f45f70, #df4659)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow:
                          "0 7px 16px rgba(223, 70, 89, 0.18)",
                      }}
                    >
                      Retake Assessment →
                    </button>

                    {/* ==================================================
                        TREND + LAST 7 DAYS
                    ================================================== */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "8px",
                      }}
                    >
                      {/* TREND */}

                      <div
                        style={{
                          minWidth: 0,
                          padding: "9px 10px",
                          borderRadius: "11px",
                          background:
                            "rgba(255,255,255,0.88)",
                          border:
                            "1px solid rgba(210,180,185,0.25)",
                          boxShadow:
                            "0 4px 12px rgba(80,40,50,0.035)",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "8px",
                            fontWeight: 700,
                            color: "#9c858b",
                            marginBottom: "4px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          TREND
                        </span>

                        <div
                          style={{
                            fontSize: "8.3px",
                            lineHeight: "1.2",
                            fontWeight: 800,
                            color: stressTrend.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stressTrend.text}
                        </div>
                      </div>

                      {/* LAST 7 DAYS */}

                      <div
                        style={{
                          minWidth: 0,
                          padding: "9px 10px",
                          borderRadius: "11px",
                          background:
                            "rgba(255,255,255,0.88)",
                          border:
                            "1px solid rgba(210,180,185,0.25)",
                          boxShadow:
                            "0 4px 12px rgba(80,40,50,0.035)",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "8px",
                            fontWeight: 700,
                            color: "#9c858b",
                            marginBottom: "4px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          LAST 7 DAYS
                        </span>

                        <div
                          style={{
                            fontSize: "8.5px",
                            lineHeight: "1.2",
                            fontWeight: 800,
                            color: "#3c3540",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Avg.{" "}
                          {last7StressAverage.toFixed(1)}
                          /10
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="analytics-empty-chart">
                  <span>🧠</span>

                  <h3>
                    No stress assessment yet
                  </h3>

                  <p>
                    Complete a stress assessment
                    to see your stress indicator.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/stress-assessment"
                      )
                    }
                  >
                    Start Assessment →
                  </button>
                </div>
              )}
            </div>

          </section>

          {/* ==================================================
              SLEEP — CIRCULAR SLEEP GAUGE
          ================================================== */}

          <section className="analytics-section">

            <div className="analytics-section-heading">

              <div>

                <p className="analytics-eyebrow sleep-eyebrow">
                  SLEEP ANALYTICS
                </p>

                <h2>
                  Your sleep pattern
                </h2>

                <p>
                  Your average sleep duration
                  compared with the 8-hour target.
                </p>

              </div>

              <span className="analytics-target sleep-target">
                Target: 8h
              </span>

            </div>

            <div
              className="sleep-gauge-card"
              style={{
                width: "100%",
                height: "285px",
                minHeight: "285px",
                maxHeight: "285px",
                padding: "16px 18px",
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                borderRadius: "22px",
                border: "1px solid rgba(108, 99, 232, 0.16)",
                background:
                  "linear-gradient(135deg, #fbfaff 0%, #f7f6ff 55%, #ffffff 100%)",
                boxShadow:
                  "0 14px 35px rgba(65, 55, 120, 0.07)",
              }}
            >
              {averageSleep !== null ? (
                <>
                  {/* SOFT BACKGROUND GLOW */}

                  <div
                    style={{
                      position: "absolute",
                      width: "190px",
                      height: "190px",
                      borderRadius: "50%",
                      background: "rgba(108, 99, 232, 0.07)",
                      filter: "blur(35px)",
                      left: "10px",
                      top: "55px",
                      pointerEvents: "none",
                    }}
                  />

                  {/* CARD HEADER */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      position: "relative",
                      zIndex: 2,
                      marginBottom: "14px",
                    }}
                  >
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(108, 99, 232, 0.10)",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      🌙
                    </span>

                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.5px",
                          color: "#5f57d8",
                        }}
                      >
                        Sleep Analytics
                      </p>

                      <span
                        style={{
                          display: "block",
                          marginTop: "2px",
                          fontSize: "10px",
                          color: "#7d7892",
                          fontWeight: 600,
                        }}
                      >
                        Your sleep duration and quality
                      </span>
                    </div>
                  </div>

                  {/* MAIN CONTENT */}

                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      display: "grid",
                      gridTemplateColumns: "160px minmax(0, 1fr)",
                      alignItems: "center",
                      gap: "20px",
                      height: "205px",
                    }}
                  >
                    {/* CIRCULAR SLEEP GRAPH */}

                    <div
                      style={{
                        width: "160px",
                        height: "160px",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <RadialBarChart
                          innerRadius="68%"
                          outerRadius="94%"
                          startAngle={90}
                          endAngle={-270}
                          data={[
                            {
                              value: Math.min(
                                (latestSleepHours /
                                  TARGETS.sleep) *
                                  100,
                                100
                              ),
                            },
                          ]}
                          barSize={18}
                          cx="50%"
                          cy="50%"
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            tick={false}
                          />

                          <RadialBar
                            background={{
                              fill: "#e8e7f7",
                            }}
                            dataKey="value"
                            cornerRadius={20}
                            fill="#6c63e8"
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>

                      {/* CENTER VALUE */}

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "30px",
                            lineHeight: "1",
                            fontWeight: 800,
                            color: "#5d55d5",
                          }}
                        >
                          {latestSleepHours.toFixed(1)}h
                        </strong>

                        <span
                          style={{
                            marginTop: "5px",
                            fontSize: "8px",
                            fontWeight: 700,
                            color: "#817b9a",
                          }}
                        >
                          Latest Sleep
                        </span>

                        <small
                          style={{
                            marginTop: "5px",
                            fontSize: "9px",
                          }}
                        >
                          🌙
                        </small>
                      </div>
                    </div>

                    {/* RIGHT SIDE INFORMATION */}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        minWidth: 0,
                      }}
                    >
                      {/* SLEEP SCORE */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.88)",
                          border:
                            "1px solid rgba(108,99,232,0.10)",
                          boxShadow:
                            "0 4px 12px rgba(70,60,130,0.035)",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "rgba(108,99,232,0.08)",
                            fontSize: "11px",
                          }}
                        >
                          ⭐
                        </span>

                        <div>
                          {/* AVERAGE SLEEP */}

                          <span
                            style={{
                              display: "block",
                              fontSize: "8px",
                              fontWeight: 700,
                              color: "#9690a9",
                            }}
                          >
                            Avg. Sleep
                          </span>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "2px",
                              fontSize: "11px",
                              color: "#403a73",
                            }}
                          >
                            {averageSleep.toFixed(1)}h
                          </strong>

                          {/* SLEEP SCORE */}

                          <span
                            style={{
                              display: "block",
                              marginTop: "6px",
                              fontSize: "8px",
                              fontWeight: 700,
                              color: "#9690a9",
                            }}
                          >
                            Sleep Score
                          </span>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "2px",
                              fontSize: "11px",
                              color: "#403a73",
                            }}
                          >
                            {averageSleepScore}/100
                          </strong>
                        </div>
                      </div>
                      {/* TARGET */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.88)",
                          border:
                            "1px solid rgba(108,99,232,0.10)",
                          boxShadow:
                            "0 4px 12px rgba(70,60,130,0.035)",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "rgba(108,99,232,0.08)",
                            fontSize: "11px",
                          }}
                        >
                          🎯
                        </span>

                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "8px",
                              fontWeight: 700,
                              color: "#9690a9",
                            }}
                          >
                            Target
                          </span>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "2px",
                              fontSize: "11px",
                              color: "#403a73",
                            }}
                          >
                            {TARGETS.sleep}h
                          </strong>
                        </div>
                      </div>

                      {/* STATUS */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.88)",
                          border:
                            "1px solid rgba(108,99,232,0.10)",
                          boxShadow:
                            "0 4px 12px rgba(70,60,130,0.035)",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              averageSleep >= TARGETS.sleep
                                ? "rgba(61,155,112,0.10)"
                                : "rgba(209,142,53,0.10)",
                            fontSize: "11px",
                          }}
                        >
                          {averageSleep >= TARGETS.sleep
                            ? "✓"
                            : "●"}
                        </span>

                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "8px",
                              fontWeight: 700,
                              color: "#9690a9",
                            }}
                          >
                            Status
                          </span>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "2px",
                              fontSize: "10px",
                              color:
                                averageSleep >= TARGETS.sleep
                                  ? "#3d9b70"
                                  : averageSleep >= 7
                                  ? "#b18435"
                                  : "#d25d68",
                            }}
                          >
                            {averageSleep >= TARGETS.sleep
                              ? "Excellent"
                              : averageSleep >= 7
                              ? "Good"
                              : "Fair"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="analytics-empty-chart sleep-empty">
                  <span>🌙</span>

                  <h3>
                    No sleep data yet
                  </h3>

                  <p>
                    Add sleep records to see
                    your sleep analytics.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/sleep")
                    }
                  >
                    Open Sleep Tracker →
                  </button>
                </div>
              )}
            </div>

          </section>

        </div>

        {/* ==================================================
            NUTRITION ANALYTICS
        ================================================== */}

        <section className="analytics-section nutrition-reference-section">

          {/* ==================================================
              SECTION HEADER
          ================================================== */}

          {/* ==================================================
              MAIN NUTRITION DASHBOARD
          ================================================== */}

          <div className="nutrition-reference-grid">


            {/* ==================================================
                LEFT — NUTRITION TREND GRAPH
            ================================================== */}

            <div className="nutrition-reference-chart-card">

              <div className="nutrition-card-reference-header">

                <div className="nutrition-card-reference-title">

                  <div className="nutrition-card-reference-icon">
                    🍴
                  </div>

                  <div>
                    <h2>
                      Nutrition Analytics
                    </h2>

                    <p>
                      Your daily nutrition intake
                    </p>
                  </div>

                </div>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(
                      Number(event.target.value)
                    )
                  }
                  className="nutrition-period-select"
                  aria-label="Nutrition analysis period"
                >
                  <option value={7}>
                    7 days
                  </option>

                  <option value={14}>
                    14 days
                  </option>

                  <option value={30}>
                    30 days
                  </option>
                </select>

              </div>

              <div className="nutrition-reference-chart">
 
                {nutritionChartData.length >= 1 ? (

                  <ResponsiveContainer
                    width="100%"
                    height={235}
                  >

                    <LineChart
                      data={nutritionChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#edf1f4"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 9,
                          fill: "#82958f",
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />

                      {/* CALORIES AXIS */}

                      <YAxis
                        yAxisId="calories"
                        orientation="left"
                        domain={[0, 1000]}
                        ticks={[0, 250, 500, 750, 1000]}
                        tick={{
                          fontSize: 9,
                          fill: "#82958f",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={34}
                      />

                      {/* MACRO AXIS */}

                      <YAxis
                        yAxisId="macros"
                        orientation="right"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                        width={5}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border:
                            "1px solid #e1e9ed",
                          boxShadow:
                            "0 8px 24px rgba(30,60,70,0.10)",
                          fontSize: 11,
                        }}
                      />


                      {/* CALORIES */}

                      <Line
                        yAxisId="calories"
                        type="monotone"
                        dataKey="calories"
                        name="Calories"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#f59e0b",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />


                      {/* PROTEIN */}

                      <Line
                        yAxisId="macros"
                        type="monotone"
                        dataKey="protein"
                        name="Protein"
                        stroke="#2fb58b"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#2fb58b",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />


                      {/* CARBS */}

                      <Line
                        yAxisId="macros"
                        type="monotone"
                        dataKey="carbs"
                        name="Carbs"
                        stroke="#2f80ed"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#2f80ed",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />


                      {/* FATS */}

                      <Line
                        yAxisId="macros"
                        type="monotone"
                        dataKey="fats"
                        name="Fats"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#8b5cf6",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="analytics-empty-chart">

                    <span>
                      🥗
                    </span>

                    <h3>
                      Not enough nutrition data yet
                    </h3>

                    <p>
                      Add food entries on
                      multiple days to see
                      nutrition trends.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/nutrition")
                      }
                    >
                      Open Nutrition →
                    </button>

                  </div>

                )}

              </div>


              {/* ==================================================
                  GRAPH LEGEND
              ================================================== */}

              <div className="nutrition-reference-legend">

                <span>
                  <i className="legend-calories" />
                  Calories
                </span>

                <span>
                  <i className="legend-protein" />
                  Protein
                </span>

                <span>
                  <i className="legend-carbs" />
                  Carbs
                </span>

                <span>
                  <i className="legend-fats" />
                  Fats
                </span>

              </div>

            </div>


            {/* ==================================================
                RIGHT — MACRONUTRIENT DONUT
            ================================================== */}

            <div className="nutrition-reference-macro-card">

              <div className="nutrition-reference-macro-header">

                <div className="nutrition-card-reference-title">

                  <div className="nutrition-card-reference-icon nutrition-macro-icon">
                    🍃
                  </div>

                  <div>
                    <h3>
                      Macronutrient Distribution
                    </h3>

                    <p>
                      Energy from macronutrients
                    </p>
                  </div>

                </div>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(
                      Number(event.target.value)
                    )
                  }
                  className="nutrition-period-select nutrition-macro-period"
                  aria-label="Macro analysis period"
                >
                  <option value={7}>
                    7 days
                  </option>

                  <option value={14}>
                    14 days
                  </option>

                  <option value={30}>
                    30 days
                  </option>
                </select>

              </div>


              {recentNutrition.length > 0 ? (

                <div className="nutrition-reference-macro-body">


                  {/* DONUT */}

                  <div className="nutrition-reference-donut">

                    <ResponsiveContainer
                      width="100%"
                      height={190}
                    >

                      <PieChart>

                        <Pie
                          data={[
                            {
                              name: "Carbs",
                              value:
                                Number(
                                  macroData.carbPercentage
                                ) || 0,
                            },
                            {
                              name: "Protein",
                              value:
                                Number(
                                  macroData.proteinPercentage
                                ) || 0,
                            },
                            {
                              name: "Fats",
                              value:
                                Number(
                                  macroData.fatPercentage
                                ) || 0,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={1}
                          dataKey="value"
                          stroke="none"
                        >

                          <Cell fill="#2f80ed" />
                          <Cell fill="#2fb58b" />
                          <Cell fill="#f59e0b" />

                        </Pie>

                      </PieChart>

                    </ResponsiveContainer>


                    <div className="nutrition-reference-donut-center">

                      <strong>
                        {Math.round(
                          totalCalories
                        )}
                      </strong>

                      <span>
                        <h2>Total kcal</h2>
                      </span>

                    </div>

                  </div>


                  {/* MACRO LEGEND */}

                  <div className="nutrition-reference-macro-list">


                    <div className="nutrition-reference-macro-item">

                      <div>

                        <i className="macro-dot carbs-dot" />

                        <span>
                          <h2>Carbs</h2>
                        </span>

                      </div>

                      <div>

                        <strong>
                          {Math.round(
                            macroData.totalCarbs * 4
                          )} kcal
                        </strong>

                        <small>
                          {macroData.carbPercentage}%
                        </small>

                      </div>

                    </div>


                    <div className="nutrition-reference-macro-item">

                      <div>

                        <i className="macro-dot protein-dot" />

                        <span>
                          <h2>Protein</h2>
                        </span>

                      </div>

                      <div>

                        <strong>
                          {Math.round(
                            macroData.totalProteinMacro * 4
                          )} kcal
                        </strong>

                        <small>
                          {macroData.proteinPercentage}%
                        </small>

                      </div>

                    </div>


                    <div className="nutrition-reference-macro-item">

                      <div>

                        <i className="macro-dot fats-dot" />

                        <span>
                          <h2>Fats</h2>
                        </span>

                      </div>

                      <div>

                        <strong>
                          {Math.round(
                            macroData.totalFats * 9
                          )} kcal
                        </strong>

                        <small>
                          {macroData.fatPercentage}%
                        </small>

                      </div>

                    </div>


                  </div>

                </div>

              ) : (

                <div className="macro-empty">

                  Add nutrition entries to see
                  macronutrient distribution.

                </div>

              )}

            </div>

          </div>

        </section>

        {/* ==================================================
            HYDRATION + WELLNESS TRENDS
        ================================================== */}

        <section className="analytics-section wellness-bottom-reference-section">

          <div className="wellness-bottom-reference-grid">

            {/* ==================================================
                HYDRATION
            ================================================== */}

            <div className="hydration-reference-card">

              {/* HEADER */}

              <div className="reference-card-header">

                <div className="reference-card-title">

                  <div className="reference-card-icon hydration-reference-icon">
                    💧
                  </div>

                  <div>

                    <h2>
                      Hydration
                    </h2>

                    <p>
                      Your water intake progress
                    </p>

                  </div>

                </div>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(
                      Number(event.target.value)
                    )
                  }
                  className="reference-period-select"
                  aria-label="Hydration period"
                >
                  <option value={7}>
                    7 days
                  </option>

                  <option value={14}>
                    14 days
                  </option>

                  <option value={30}>
                    30 days
                  </option>
                </select>

              </div>


              {/* HYDRATION BODY */}

              <div className="hydration-reference-body">

                {/* DONUT */}

                <div className="hydration-reference-donut">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={hydrationChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={47}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >

                        <Cell
                          fill="#3faee0"
                        />

                        <Cell
                          fill="#e6f1f5"
                        />

                      </Pie>

                    </PieChart>

                  </ResponsiveContainer>

                  <div className="hydration-reference-donut-center">

                    <strong>
                      {hydrationPercentage}%
                    </strong>

                    <span>
                      {wellnessData.water} glasses
                    </span>

                  </div>

                </div>


                {/* TARGET + STATUS */}

                <div className="hydration-reference-details">

                  <div className="hydration-reference-detail-box">

                    <span>
                      Target
                    </span>

                    <strong>
                      {TARGETS.water} glasses
                    </strong>

                  </div>


                  <div className="hydration-reference-detail-box">

                    <span>
                      Status
                    </span>

                    <strong
                      className={
                        hydrationPercentage >= 100
                          ? "hydration-status-good"
                          : hydrationPercentage >= 60
                          ? "hydration-status-progress"
                          : "hydration-status-low"
                      }
                    >

                      {hydrationPercentage >= 100
                        ? "Great"
                        : hydrationPercentage >= 60
                        ? "Good"
                        : "Needs attention"}

                    </strong>

                  </div>

                </div>

              </div>


              {/* GLASS INDICATORS */}

              <div className="hydration-reference-glasses">

                {Array.from({
                  length: TARGETS.water,
                }).map((_, index) => (

                  <span
                    key={index}
                    className={
                      index <
                      Number(
                        wellnessData.water || 0
                      )
                        ? "glass-filled"
                        : "glass-empty"
                    }
                  >
                    ▼
                  </span>

                ))}

              </div>

            </div>


            {/* ==================================================
                WELLNESS TRENDS
            ================================================== */}

            <div className="wellness-trends-reference-card">

              {/* HEADER */}

              <div className="reference-card-header">

                <div className="reference-card-title">

                  <div className="reference-card-icon trends-reference-icon">
                    ↗
                  </div>

                  <div>

                    <h2>
                      Wellness Trends
                    </h2>

                    <p>
                      How your wellness areas are changing
                    </p>

                  </div>

                </div>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(
                      Number(event.target.value)
                    )
                  }
                  className="reference-period-select"
                  aria-label="Wellness trends period"
                >

                  <option value={7}>
                    7 days
                  </option>

                  <option value={14}>
                    14 days
                  </option>

                  <option value={30}>
                    30 days
                  </option>

                </select>

              </div>


              {/* GRAPH */}

              <div className="wellness-trends-reference-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={wellnessTrendData}
                    margin={{
                      top: 3,
                      right: 6,
                      left: 0,
                      bottom: 2,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="2 3"
                      vertical={false}
                      stroke="#e7eeee"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 7,
                        fill: "#82958f",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={6}
                    />

                    <YAxis
                      domain={[0, 100]}
                      ticks={[
                        0,
                        25,
                        50,
                        75,
                        100,
                      ]}
                      tick={{
                        fontSize: 7,
                        fill: "#82958f",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={22}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "7px",
                        border:
                          "1px solid #e2eae7",
                        background: "#ffffff",
                        fontSize: "8px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="mental"
                      name="Mental"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      connectNulls={true}
                      dot={{
                        r: 3,
                        fill: "#f59e0b",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="stress"
                      name="Stress"
                      stroke="#ef6b7a"
                      strokeWidth={1.5}
                      connectNulls={true}
                      dot={{
                        r: 3,
                        fill: "#ef6b7a",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="sleep"
                      name="Sleep"
                      stroke="#2f80ed"
                      strokeWidth={1.5}
                      connectNulls={true}
                      dot={{
                        r: 3,
                        fill: "#2f80ed",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="nutrition"
                      name="Nutrition"
                      stroke="#2fb58b"
                      strokeWidth={1.5}
                      connectNulls={true}
                      dot={{
                        r: 3,
                        fill: "#2fb58b",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="hydration"
                      name="Hydration"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      connectNulls={true}
                      dot={{
                        r: 3,
                        fill: "#8b5cf6",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>


              {/* REFERENCE-STYLE LEGEND */}

              <div className="wellness-reference-legend">

                <span>
                  <i className="legend-dot mental-dot" />
                  Mental
                </span>

                <span>
                  <i className="legend-dot stress-dot" />
                  Stress
                </span>

                <span>
                  <i className="legend-dot sleep-dot" />
                  Sleep
                </span>

                <span>
                  <i className="legend-dot nutrition-dot" />
                  Nutrition
                </span>

                <span>
                  <i className="legend-dot hydration-dot" />
                  Hydration
                </span>

              </div>

            </div>

          </div>

        </section>
        {/* ==================================================
            DISCLAIMER
        ================================================== */}

        <div className="analytics-disclaimer">

          <span>ⓘ</span>

          <p>
            MindNutri Analytics are
            educational wellness
            summaries based on the
            information you record.
            They are not medical,
            psychiatric or clinical
            diagnoses.
          </p>

        </div>

      </main>

    </div>
  );
}

export default WellnessAnalytics;