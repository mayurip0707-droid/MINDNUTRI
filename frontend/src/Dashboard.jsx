import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import MyProfile from "./pages/MyProfile";

import "./Dashboard.css";

const getUserInitials = (fullName) => {
  if (!fullName) return "U";

  const names = fullName.trim().split(/\s+/);

  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
};

const getAvatarColor = (fullName) => {
  if (!fullName) return 0;

  let hash = 0;

  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 6;
};
const avatarGradients = [
  "linear-gradient(135deg, #00a878, #39c6a0)",
  "linear-gradient(135deg, #5b5bd6, #8b7de8)",
  "linear-gradient(135deg, #e96b9b, #f59ab8)",
  "linear-gradient(135deg, #e58a32, #f4b45d)",
  "linear-gradient(135deg, #3688c8, #62b5e8)",
  "linear-gradient(135deg, #8c5bb5, #b77bd3)",
];

const getAvatarGradient = (fullName) => {
  return avatarGradients[getAvatarColor(fullName)];
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // STATES
  // ============================================================

  const [activeMenu, setActiveMenu] =
    useState("Dashboard");

  const [isFemaleUser, setIsFemaleUser] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(
        "mindnutri_user_profile"
      );

      if (!storedProfile) {
        setIsFemaleUser(false);
        return;
      }

      const profile = JSON.parse(storedProfile);

      setUserProfile(profile);

      setIsFemaleUser(
        String(profile?.gender || "").toLowerCase() === "female"
      );
    } catch (error) {
      console.error(
        "Unable to load user profile:",
        error
      );

      setIsFemaleUser(false);
    }
  }, []);

  useEffect(() => {
    const syncUserProfile = () => {
      try {
        const storedProfile = localStorage.getItem(
          "mindnutri_user_profile"
        );

        if (!storedProfile) {
          setUserProfile(null);
          setIsFemaleUser(false);
          return;
        }

        const profile = JSON.parse(storedProfile);

        setUserProfile(profile);
        setIsFemaleUser(
          String(profile?.gender || "").toLowerCase() === "female"
        );
      } catch (error) {
        console.error("Unable to sync user profile:", error);
      }
    };

    window.addEventListener(
      "mindnutri-profile-updated",
      syncUserProfile
    );

    return () => {
      window.removeEventListener(
        "mindnutri-profile-updated",
        syncUserProfile
      );
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/profile") {
      setActiveMenu("My Profile");
    }
  }, [location.pathname]);

  const [stressResult, setStressResult] =
    useState(null);

  const [moodResult, setMoodResult] =
    useState(null);

  const [overallWellnessData, setOverallWellnessData] =
    useState([]);

  const [nutritionHistory, setNutritionHistory] = 
    useState([]);
    
  const [waterIntake, setWaterIntake] = 
    useState(0);

  const [sleepResult, setSleepResult] = 
    useState(0);

  // ============================================================
  // LOCAL STORAGE KEYS
  // ============================================================

  const STRESS_KEY =
    "mindnutri_stress_result";

  const MOOD_HISTORY_KEY =
    "mindnutri_mood_history";

  const SLEEP_KEY =
    "mindnutri_sleep_data";

  const NUTRITION_KEY =
    "mindnutri_nutrition_data";

  const NUTRITION_HISTORY_KEY =
    "mindnutri_nutrition_history";

  const WATER_KEY =
    "mindnutri_water";

  // ============================================================
  // UPDATE ACTIVE MENU
  // ============================================================

  useEffect(() => {
    const path = location.pathname;

    if (path === "/dashboard") {
      setActiveMenu("Dashboard");
    } else if (path === "/stress-assessment") {
      setActiveMenu("Mental Wellness");
    } else if (path === "/mood-journal") {
      setActiveMenu("Mood Journal");
    } else if (path === "/nutrition") {
      setActiveMenu("Nutrition Wellness");
    } else if (path === "/sleep") {
      setActiveMenu("Sleep Tracker");
    } else if (path === "/wellness-analytics") {
      setActiveMenu("Wellness Analytics");
    } else if (path === "/wellness-insights") {
      setActiveMenu("Wellness Insights");
    } else if (path === "/weekly-report") {
      setActiveMenu("Weekly Report");
    } else if (path === "/goals-action-plan") {
      setActiveMenu("Goals & Action Plan");
    }
  }, [location.pathname]);

  // ============================================================
  // LOAD WELLNESS DATA
  // ============================================================

  useEffect(() => {
    const loadWellnessData = () => {
      // ----------------------------------------------------------
      // STRESS
      // ----------------------------------------------------------

      try {
        const savedStress =
          localStorage.getItem(STRESS_KEY);

        if (savedStress) {
          setStressResult(
            JSON.parse(savedStress)
          );
        } else {
          setStressResult(null);
        }
      } catch (error) {
        console.error(
          "Unable to load stress result:",
          error
        );

        setStressResult(null);
      }

      // ----------------------------------------------------------
      // MOOD
      // ----------------------------------------------------------

      try {
        const savedMood =
          localStorage.getItem(
            MOOD_HISTORY_KEY
          );

        if (savedMood) {
          const parsedMood =
            JSON.parse(savedMood);

          if (
            Array.isArray(parsedMood) &&
            parsedMood.length > 0
          ) {
            // Latest entry
            setMoodResult(
              parsedMood[
                parsedMood.length - 1
              ]
            );
          } else {
            setMoodResult(null);
          }
        } else {
          setMoodResult(null);
        }
      } catch (error) {
        console.error(
          "Unable to load mood history:",
          error
        );

        setMoodResult(null);
      }

      // ----------------------------------------------------------
      // SLEEP
      // ----------------------------------------------------------

      try {
        const savedSleep =
          localStorage.getItem(SLEEP_KEY);

        if (savedSleep) {
          setSleepResult(
            JSON.parse(savedSleep)
          );
        } else {
          setSleepResult(null);
        }
      } catch (error) {
        console.error(
          "Unable to load sleep result:",
          error
        );

        setSleepResult(null);
      }

      // ============================================================
      // NUTRITION HISTORY
      // ============================================================

      try {
        const savedNutritionHistory =
          localStorage.getItem(
            NUTRITION_HISTORY_KEY
          );

        if (savedNutritionHistory) {
          const parsedNutrition =
            JSON.parse(savedNutritionHistory);

          if (Array.isArray(parsedNutrition)) {
            setNutritionHistory(parsedNutrition);
          } else {
            setNutritionHistory([]);
          }
        } else {
          setNutritionHistory([]);
        }

      } catch (error) {

        console.error(
          "Unable to load nutrition history:",
          error
        );

        setNutritionHistory([]);
      }


      // ============================================================
      // WATER
      // ============================================================

      try {
        const savedWater =
          localStorage.getItem(WATER_KEY);

        if (savedWater !== null) {

          const numericWater =
            Number(savedWater);

          setWaterIntake(
            Number.isFinite(numericWater)
              ? Math.max(
                  0,
                  Math.min(8, numericWater)
                )
              : 0
          );

        } else {
          setWaterIntake(0);
        }

      } catch (error) {

        console.error(
          "Unable to load water intake:",
          error
        );

        setWaterIntake(0);
      }
    };

    loadWellnessData();

    // Update dashboard when localStorage changes
    window.addEventListener(
      "storage",
      loadWellnessData
    );

    // Refresh data when returning to dashboard
    window.addEventListener(
      "focus",
      loadWellnessData
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadWellnessData
      );

      window.removeEventListener(
        "focus",
        loadWellnessData
      );
    };
  }, []);

  // ============================================================
  // MENU ITEMS
  // ============================================================

  const menuItems = [
    // ----------------------------------------------------------
    // MAIN
    // ----------------------------------------------------------

    {
      name: "Dashboard",
      icon: "⌂",
      action: () =>
        navigate("/dashboard"),
    },

    // ----------------------------------------------------------
    // WELLNESS
    // ----------------------------------------------------------

    {
      name: "Mental Wellness",
      icon: "🧠",
      action: () =>
        navigate("/stress-assessment"),
    },

    {
      name: "Mood Journal",
      icon: "💭",
      action: () =>
        navigate("/mood-journal"),
    },

    {
      name: "Nutrition Wellness",
      icon: "🥗",
      action: () =>
        navigate("/nutrition"),
    },

    {
      name: "Sleep Tracker",
      icon: "🌙",
      action: () =>
        navigate("/sleep"),
    },
    ...(isFemaleUser
      ? [
          {
            name: "Menstrual Wellness",
            icon: "🌸",
            action: () =>
              navigate("/menstrual-wellness"),
          },
        ]
      : []),

    // ----------------------------------------------------------
    // ANALYTICS
    // ----------------------------------------------------------

    {
      name: "Wellness Analytics",
      icon: "📊",
      action: () =>
        navigate("/wellness-analytics"),
    },

    {
      name: "Wellness Insights",
      icon: "💡",
      action: () =>
        navigate("/wellness-insights"),
    },

    {
      name: "Weekly Report",
      icon: "📄",
      action: () =>
        navigate("/weekly-report"),
    },

    // ----------------------------------------------------------
    // PLANNING
    // ----------------------------------------------------------

    {
      name: "Goals & Action Plan",
      icon: "🎯",
      action: () =>
        navigate("/goals-action-plan"),
    },

    {
      name: "My Profile",
      icon: "👤",
      action: () => navigate("/profile"),
    },
  ];

  // ============================================================
  // STRESS LEVEL
  // ============================================================

  const getStressLevel = () => {
    if (!stressResult) {
      return "Not Assessed";
    }

    return String(
      stressResult.prediction ||
        "Moderate"
    );
  };

  // ============================================================
  // STRESS SCORE
  // ============================================================

  const getStressScore = () => {
    if (!stressResult) {
      return null;
    }

    const score = Number(
      stressResult.stressScore
    );

    if (Number.isNaN(score)) {
      return null;
    }

    return Math.min(
      Math.max(score, 0),
      10
    );
  };

  // ============================================================
  // STRESS CLASS
  // ============================================================

  const getStressClass = () => {
    const prediction =
      getStressLevel().toLowerCase();

    if (prediction === "high") {
      return "stress-high";
    }

    if (prediction === "low") {
      return "stress-low";
    }

    if (
      prediction === "moderate" ||
      prediction === "medium"
    ) {
      return "stress-moderate";
    }

    return "";
  };

  // ============================================================
  // STRESS EMOJI
  // ============================================================

  const getStressEmoji = () => {
    const prediction =
      getStressLevel().toLowerCase();

    if (prediction === "high") {
      return "🔴";
    }

    if (prediction === "low") {
      return "🟢";
    }

    if (
      prediction === "moderate" ||
      prediction === "medium"
    ) {
      return "🟡";
    }

    return "🧠";
  };

  // ============================================================
  // MOOD EMOJI
  // ============================================================

  const getMoodEmoji = () => {
    if (!moodResult) {
      return "😊";
    }

    const emotion = String(
      moodResult.emotion || ""
    ).toLowerCase();

    const emojiMap = {
      happiness: "😊",
      happy: "😊",
      joy: "😄",
      sadness: "😔",
      sad: "😔",
      stress: "😣",
      stressed: "😣",
      anger: "😠",
      angry: "😠",
      anxiety: "😟",
      anxious: "😟",
      fear: "😟",
      calm: "😌",
      neutral: "🙂",
    };

    return (
      emojiMap[emotion] || "🙂"
    );
  };

  // ============================================================
  // OVERALL WELLNESS SCORE
  // ============================================================

  const getWellnessScore = () => {

    // ============================================================
    // MENTAL WELLNESS — 30%
    // ============================================================

    const mentalScore =
      moodResult
        ? Math.max(
            0,
            Math.min(
              100,
              Number(
                moodResult.moodScore
              ) || 0
            )
          )
        : 0;


    // ============================================================
    // STRESS WELLNESS — 20%
    // Lower stress = higher wellness
    // ============================================================

    const rawStressScore =
      stressResult
        ? Number(
            stressResult.stressScore
          ) || 0
        : null;

    const stressWellnessScore =
      rawStressScore !== null
        ? Math.max(
            0,
            Math.min(
              100,
              100 -
                rawStressScore * 10
            )
          )
        : 0;


    // ============================================================
    // SLEEP WELLNESS — 20%
    // Sleep quality is 0–5
    // ============================================================

    const sleepWellnessScore =
      sleepResult
        ? Math.max(
            0,
            Math.min(
              100,
              (
                (
                  Number(
                    sleepResult.quality
                  ) || 0
                ) / 5
              ) * 100
            )
          )
        : 0;


    // ============================================================
    // TODAY'S NUTRITION
    // ============================================================

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const todayNutrition =
      nutritionHistory.filter(
        (entry) =>
          entry.date === today
      );


    // ============================================================
    // NUTRITION TOTALS
    // ============================================================

    const nutritionTotals =
      todayNutrition.reduce(
        (total, entry) => ({

          calories:
            total.calories +
            Number(
              entry.calories || 0
            ),

          protein:
            total.protein +
            Number(
              entry.protein || 0
            ),

          fiber:
            total.fiber +
            Number(
              entry.fiber || 0
            ),

        }),
        {
          calories: 0,
          protein: 0,
          fiber: 0,
        }
      );


    // ============================================================
    // NUTRITION CATEGORY VARIETY
    // ============================================================

    const nutritionCategoryCount =
      new Set(
        todayNutrition.map(
          (item) =>
            item.category
        )
      ).size;


    // ============================================================
    // NUTRITION WELLNESS — 15%
    // ============================================================

    let nutritionScore = 0;

    if (
      todayNutrition.length > 0
    ) {

      const calorieRatio =
        nutritionTotals.calories /
        2000;

      const calorieScore =
        calorieRatio <= 1
          ? calorieRatio * 100
          : Math.max(
              0,
              100 -
                (calorieRatio - 1) *
                  100
            );

      const proteinScore =
        Math.min(
          (
            nutritionTotals.protein /
            80
          ) * 100,
          100
        );

      const fiberScore =
        Math.min(
          (
            nutritionTotals.fiber /
            30
          ) * 100,
          100
        );

      const hydrationInsideNutrition =
        Math.min(
          (waterIntake / 8) * 100,
          100
        );

      const varietyScore =
        Math.min(
          nutritionCategoryCount *
            20,
          100
        );

      nutritionScore =
        calorieScore * 0.30 +
        proteinScore * 0.20 +
        fiberScore * 0.15 +
        hydrationInsideNutrition * 0.15 +
        varietyScore * 0.20;
    }


    // ============================================================
    // HYDRATION WELLNESS — 15%
    // ============================================================

    const hydrationScore =
      Math.max(
        0,
        Math.min(
          100,
          (waterIntake / 8) * 100
        )
      );


    // ============================================================
    // FINAL OVERALL WELLNESS SCORE
    // ============================================================

    const hasAnyData =
      moodResult ||
      stressResult ||
      sleepResult ||
      todayNutrition.length > 0 ||
      waterIntake > 0;

    if (!hasAnyData) {
      return null;
    }


    // ============================================================
    // WEIGHTED 5-FACTOR SCORE
    // ============================================================

    const overallScore =
      mentalScore * 0.30 +
      stressWellnessScore * 0.20 +
      sleepWellnessScore * 0.20 +
      nutritionScore * 0.15 +
      hydrationScore * 0.15;


    return Math.round(
      Math.max(
        0,
        Math.min(
          100,
          overallScore
        )
      )
    );
  };

  // ============================================================
  // WELLNESS STATUS
  // ============================================================

  const getWellnessStatus = () => {
    const score =
      getWellnessScore();

    if (score === null) {
      return "Let's get started";
    }

    if (score >= 80) {
      return "You're doing great 🌿";
    }

    if (score >= 60) {
      return "You're doing well";
    }

    if (score >= 40) {
      return "A little extra care";
    }

    return "Be gentle with yourself";
  };

  // ============================================================
  // PERSONALIZED MOTIVATION
  // ============================================================

  const getMotivationalMessage = () => {
    const stress =
      getStressLevel().toLowerCase();

    const moodScore = moodResult
      ? Number(moodResult.moodScore)
      : null;

    if (stress === "high") {
      return {
        title:
          "It's okay to slow down. 🌱",

        text:
          "You seem to be carrying a little more stress today. You don't have to fix everything at once. Take one small step, breathe, and give yourself some space.",
      };
    }

    if (
      moodScore !== null &&
      moodScore < 40
    ) {
      return {
        title:
          "A difficult moment doesn't define your day. 💚",

        text:
          "You noticed how you feel and took time to reflect. That's already a positive step. Be kind to yourself today.",
      };
    }

    if (stress === "moderate") {
      return {
        title:
          "One small step is enough today. 🌿",

        text:
          "Your wellness is a journey, not a competition. Try one simple action that helps your mind and body feel a little better.",
      };
    }

    if (
      moodScore !== null &&
      moodScore >= 80
    ) {
      return {
        title:
          "You're bringing good energy today! ✨",

        text:
          "Keep enjoying the moments that make you feel good. Small positive habits can build a healthier routine over time.",
      };
    }

    if (stress === "low") {
      return {
        title:
          "You're doing well — keep going! 🌱",

        text:
          "Your current wellness indicators look encouraging. Keep protecting the habits that help you feel balanced.",
      };
    }

    return {
      title:
        "Welcome to your wellness journey. 💚",

      text:
        "Start with one simple check-in today. Understanding yourself is the first step toward building better habits.",
    };
  };

  // ============================================================
  // TODAY'S SMALL STEP
  // ============================================================

  const getSmallStep = () => {
    const stress =
      getStressLevel().toLowerCase();

    const moodScore = moodResult
      ? Number(moodResult.moodScore)
      : null;

    if (stress === "high") {
      return {
        icon: "🌬️",

        title:
          "Take a 5-minute reset",

        text:
          "Step away from your screen, take 5 slow breaths and relax your shoulders.",
      };
    }

    if (
      moodScore !== null &&
      moodScore < 40
    ) {
      return {
        icon: "💚",

        title:
          "Do one thing you enjoy",

        text:
          "Listen to music, talk to someone you trust, or spend a few quiet minutes doing something you like.",
      };
    }

    if (stress === "moderate") {
      return {
        icon: "💧",

        title:
          "Hydrate & take a short break",

        text:
          "Drink some water and take a few minutes away from your current task.",
      };
    }

    if (
      moodScore !== null &&
      moodScore >= 80
    ) {
      return {
        icon: "✨",

        title:
          "Capture today's positive moment",

        text:
          "Write down one thing that made you smile today so you can remember it later.",
      };
    }

    return {
      icon: "🌿",

      title:
        "Check in with yourself",

      text:
        "Take a moment to notice how your mind and body are feeling today.",
    };
  };

  // ============================================================
  // HANDLE MENU CLICK
  // ============================================================

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);

    if (item.action) {
      item.action();
    } else {
      alert(
        `${item.name} module is coming next! 🌱`
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  // ============================================================
  // DASHBOARD DATA
  // ============================================================

  const wellnessScore =
    getWellnessScore();

  const motivation =
    getMotivationalMessage();

  const smallStep =
    getSmallStep();

  // ============================================================
  // RADAR SCORE HELPER
  // ============================================================

  const clampScore = (value) => {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(value) || 0
        )
      )
    );
  };

  // ============================================================
  // RADAR DATA
  // ============================================================

  // Mental wellness
  const mentalRadarScore =
    moodResult
      ? clampScore(
          Number(
            moodResult.moodScore
          )
        )
      : 0;

  // Stress wellness
  // Stress score is 0–10.
  // Lower stress = higher wellness.
  const stressRadarScore =
    stressResult
      ? clampScore(
          100 -
            (Number(
              stressResult.stressScore
            ) || 0) *
              10
        )
      : 0;

  // Sleep wellness
  // Sleep quality is 0–5.
  const sleepRadarScore =
    sleepResult
      ? clampScore(
          ((Number(
            sleepResult.quality
          ) || 0) /
            5) *
            100
        )
      : 0;

  // ============================================================
  // CALCULATE OVERALL WELLNESS RADAR
  // ============================================================

  useEffect(() => {

    // ============================================================
    // TODAY
    // ============================================================

    const today = new Date()
      .toISOString()
      .split("T")[0];


    // ============================================================
    // TODAY'S NUTRITION
    // ============================================================

    const todayNutrition =
      nutritionHistory.filter(
        (entry) =>
          entry.date === today
      );


    // ============================================================
    // NUTRITION TOTALS
    // ============================================================

    const nutritionTotals =
      todayNutrition.reduce(
        (total, entry) => ({

          calories:
            total.calories +
            Number(
              entry.calories || 0
            ),

          protein:
            total.protein +
            Number(
              entry.protein || 0
            ),

          fiber:
            total.fiber +
            Number(
              entry.fiber || 0
            ),

        }),
        {
          calories: 0,
          protein: 0,
          fiber: 0,
        }
      );


    // ============================================================
    // CATEGORY VARIETY
    // ============================================================

    const nutritionCategoryCount =
      new Set(
        todayNutrition.map(
          (item) =>
            item.category
        )
      ).size;


    // ============================================================
    // NUTRITION SCORE
    // ============================================================

    let dashboardNutritionScore = 0;

    if (
      todayNutrition.length > 0
    ) {

      const calorieRatio =
        nutritionTotals.calories /
        2000;


      const calorieScore =
        calorieRatio <= 1
          ? calorieRatio * 100
          : Math.max(
              0,
              100 -
                (calorieRatio - 1) *
                  100
            );


      const proteinScore =
        Math.min(
          (
            nutritionTotals.protein /
            80
          ) * 100,
          100
        );


      const fiberScore =
        Math.min(
          (
            nutritionTotals.fiber /
            30
          ) * 100,
          100
        );


      const hydrationScore =
        Math.min(
          (waterIntake / 8) * 100,
          100
        );


      const varietyScore =
        Math.min(
          nutritionCategoryCount *
            20,
          100
        );


      dashboardNutritionScore =
        calorieScore * 0.30 +
        proteinScore * 0.20 +
        fiberScore * 0.15 +
        hydrationScore * 0.15 +
        varietyScore * 0.20;
    }


    // ============================================================
    // MENTAL WELLNESS SCORE
    // ============================================================

    const mentalScore =
      moodResult
        ? Number(
            moodResult.moodScore
          ) || 0
        : 0;


    // ============================================================
    // STRESS WELLNESS SCORE
    // ============================================================

    const stressWellnessScore =
      stressResult
        ? Math.max(
            0,
            100 -
              (
                Number(
                  stressResult.stressScore
                ) || 0
              ) * 10
          )
        : 0;


    // ============================================================
    // SLEEP WELLNESS SCORE
    // ============================================================

    const sleepWellnessScore =
      sleepResult
        ? Math.min(
            100,
            Math.max(
              0,
              (
                (
                  Number(
                    sleepResult.quality
                  ) || 0
                ) / 5
              ) * 100
            )
          )
        : 0;


    // ============================================================
    // HYDRATION SCORE
    // ============================================================

    console.log("WATER INTAKE:", waterIntake);
    console.log("WATER KEY:", WATER_KEY);
    console.log(
      "SAVED WATER:",
      localStorage.getItem(WATER_KEY)
    );

    const hydrationWellnessScore =
      Math.min(
        100,
        (waterIntake / 8) * 100
      );


    // ============================================================
    // RADAR DATA
    // ============================================================

    const radarData = [

      {
        subject: "Mental",
        score: clampScore(
          mentalScore
        ),
      },

      {
        subject: "Stress",
        score: clampScore(
          stressWellnessScore
        ),
      },

      {
        subject: "Sleep",
        score: clampScore(
          sleepWellnessScore
        ),
      },

      {
        subject: "Nutrition",
        score: clampScore(
          dashboardNutritionScore
        ),
      },

      {
        subject: "Hydration",
        score: clampScore(
          hydrationWellnessScore
        ),
      },

    ];


    console.log(
      "MINDNUTRI RADAR DATA:",
      radarData
    );


    setOverallWellnessData(
      radarData
    );

  }, [
    stressResult,
    moodResult,
    sleepResult,
    nutritionHistory,
    waterIntake,
  ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            ♡
          </div>

          <div>
            <h2>
              MINDNUTRI
            </h2>

            <p>
              Wellness Companion
            </p>
          </div>

        </div>

        <nav className="sidebar-nav">

          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={
                activeMenu === item.name
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleMenuClick(item)
              }
            >

              <span>
                {item.icon}
              </span>

              {item.name}

              {!item.action && (
                <small className="coming-soon-dot">
                  •
                </small>
              )}

            </button>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-profile">

            <div
              className="sidebar-profile-avatar"
              style={{
                background: getAvatarGradient(
                  userProfile?.fullName
                ),
              }}
            >
              {getUserInitials(
                userProfile?.fullName
              )}
            </div>

            <div className="sidebar-profile-info">

              <strong>
                {userProfile?.fullName || "User"}
              </strong>

              <span>
                {userProfile?.email || ""}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}
      {location.pathname === "/profile" ? (
        <main className="dashboard-main">
          <MyProfile />
        </main>
      ) : (
        <main className="dashboard-main">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <header className="dashboard-header">

            <div>

              <p className="welcome-small">
                WELCOME BACK 👋
              </p>

              <h1>
                Your Wellness Dashboard
              </h1>

              <p className="dashboard-subtitle">
                A simple space to understand yourself,
                build healthy habits and take one
                positive step at a time.
              </p>

            </div>

            <div
              className="profile-circle"
              style={{
                background: getAvatarGradient(userProfile?.fullName),
              }}
            >
              {getUserInitials(userProfile?.fullName)}
            </div>

          </header>

          {/* ====================================================
              DAILY MOTIVATION
          ==================================================== */}

          <section className="motivation-card">

            <div className="motivation-icon">
              🌿
            </div>

            <div className="motivation-content">

              <p className="motivation-label">
                TODAY'S MINDNUTRI MESSAGE
              </p>

              <h2>
                {motivation.title}
              </h2>

              <p>
                {motivation.text}
              </p>

            </div>

          </section>

          {/* ====================================================
              SUMMARY CARDS
          ==================================================== */}

          <section className="summary-section">

            {/* STRESS */}

            <div
              className={`summary-card stress-summary-card ${getStressClass()}`}
            >

              <span className="summary-icon">
                🧠
              </span>

              <div>

                <p>
                  Stress Level
                </p>

                {stressResult ? (
                  <>
                    <h3>
                      {getStressEmoji()}{" "}
                      {getStressLevel()}
                    </h3>

                    <small>
                      Score:{" "}
                      {getStressScore() ??
                        "--"}/10
                    </small>
                  </>
                ) : (
                  <>
                    <h3>
                      Not Assessed
                    </h3>

                    <small>
                      Complete your assessment
                    </small>
                  </>
                )}

              </div>

            </div>

            {/* MOOD */}

            <div className="summary-card">

              <span className="summary-icon">
                {getMoodEmoji()}
              </span>

              <div>

                <p>
                  Latest Mood
                </p>

                {moodResult ? (
                  <>
                    <h3>
                      {moodResult.emotion ||
                        "Neutral"}
                    </h3>

                    <small>
                      Mood Score:{" "}
                      {moodResult.moodScore}/100
                    </small>
                  </>
                ) : (
                  <>
                    <h3>
                      Not Recorded
                    </h3>

                    <small>
                      Write your first journal
                    </small>
                  </>
                )}

              </div>

            </div>

            {/* SLEEP */}

            <div className="summary-card sleep-summary-card">

              <span className="summary-icon">
                🌙
              </span>

              <div>

                <p>
                  Sleep
                </p>

                {sleepResult ? (
                  <>
                    <h3>
                      {sleepResult.duration} hrs
                    </h3>

                    <small>
                      Quality:{" "}
                      {sleepResult.quality}/5
                      {" • "}
                      Score:{" "}
                      {sleepResult.score}/100
                    </small>
                  </>
                ) : (
                  <>
                    <h3>
                      Not Recorded
                    </h3>

                    <small>
                      Log your sleep
                    </small>
                  </>
                )}

              </div>

            </div>

            {/* WELLNESS SCORE */}

            <div className="summary-card wellness-summary">

              <span className="summary-icon">
                🌿
              </span>

              <div>

                <p>
                  Wellness Score
                </p>

                {wellnessScore !== null ? (
                  <>
                    <h3>
                      {wellnessScore}/100
                    </h3>

                    <small>
                      {getWellnessStatus()}
                    </small>
                  </>
                ) : (
                  <>
                    <h3>
                      -- / 100
                    </h3>

                    <small>
                      Complete a check-in
                    </small>
                  </>
                )}

              </div>

            </div>

            {/* DAILY ACTION */}

            <div className="summary-card">

              <span className="summary-icon">
                ✨
              </span>

              <div>

                <p>
                  Today's Focus
                </p>

                <h3>
                  One Small Step
                </h3>

                <small>
                  Keep it simple & achievable
                </small>

              </div>

            </div>

          </section>

          {/* ====================================================
              TODAY'S SMALL STEP
          ==================================================== */}

          <section className="small-step-card">

            <div className="small-step-icon">
              {smallStep.icon}
            </div>

            <div className="small-step-content">

              <p className="mood-eyebrow">
                YOUR SMALL STEP FOR TODAY
              </p>

              <h2>
                {smallStep.title}
              </h2>

              <p>
                {smallStep.text}
              </p>

            </div>

          </section>

          {/* ====================================================
              WELLNESS MODULES
          ==================================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <p className="section-eyebrow">
                  EXPLORE YOUR WELLNESS
                </p>

                <h2>
                  Wellness Modules
                </h2>

                <p>
                  Use your personal wellness tools
                  whenever you need them.
                </p>

              </div>

            </div>

            <div className="module-grid">

              {/* STRESS */}

              <div className="module-card">

                <div className="module-top">

                  <div className="module-icon">
                    🧠
                  </div>

                </div>

                <h3>
                  Stress Assessment
                </h3>

                <p>
                  Understand your current stress
                  level using lifestyle and
                  questionnaire data.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/stress-assessment"
                    )
                  }
                >
                  {stressResult
                    ? "Retake Assessment →"
                    : "Start Assessment →"}
                </button>

              </div>

              {/* MOOD */}

              <div className="module-card">

                <div className="module-top">

                  <div className="module-icon">
                    💭
                  </div>

                </div>

                <h3>
                  Mood Journal
                </h3>

                <p>
                  Write freely and discover
                  sentiment, emotions and mood
                  patterns from your journal.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/mood-journal"
                    )
                  }
                >
                  Open Journal →
                </button>

              </div>

              {/* NUTRITION */}

              <div className="module-card">

                <div className="module-top">

                  <div className="module-icon">
                    🥗
                  </div>

                </div>

                <h3>
                  Nutrition Wellness
                </h3>

                <p>
                  Track your food habits, hydration,
                  calories and daily nutrition
                  patterns.
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

              {/* SLEEP */}

              <div className="module-card">

                <div className="module-top">

                  <div className="module-icon">
                    🌙
                  </div>

                </div>

                <h3>
                  Sleep Tracker
                </h3>

                <p>
                  Track your sleep duration, sleep quality
                  and daily sleep patterns to understand
                  your wellness routine.
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

            </div>

          </section>

          {/* ====================================================
              OVERALL WELLNESS BALANCE
          ==================================================== */}

          <section className="dashboard-section premium-wellness-section">

            <div className="premium-wellness-heading">

              <div className="premium-heading-left">

                <div className="premium-mini-icon">
                  🌿
                </div>

                <div>

                  <span className="premium-eyebrow">
                    YOUR WELLNESS PULSE
                  </span>

                  <h2>
                    Overall Wellness Balance
                  </h2>

                  <p>
                    See how your main wellness areas
                    are balanced.
                  </p>

                </div>

              </div>

              <div className="premium-score-box">

                <div className="premium-score-circle">

                  <span>
                    {wellnessScore !== null
                      ? wellnessScore
                      : "--"}
                  </span>

                </div>

                <div className="premium-score-text">

                  <strong>
                    Overall Score
                  </strong>

                  <small>
                    Out of 100
                  </small>

                </div>

              </div>

            </div>

            {/* RADAR CARD */}

            <div className="premium-wellness-card">

              <div className="premium-card-top">

                <div className="premium-live-status">

                  <span className="premium-live-dot"></span>

                  <span>
                    Wellness Overview
                  </span>

                </div>

                <div className="premium-trend-label">
                  🕸️ Wellness Balance
                </div>

              </div>

              {/* ==================================================
                  RADAR CHART
              ================================================== */}

              <div className="premium-chart-wrapper radar-chart-wrapper">

                <ResponsiveContainer
                  width="100%"
                  height={390}
                >

                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    data={
                      overallWellnessData
                    }
                  >

                    <PolarGrid
                      stroke="#d8d4eb"
                      strokeDasharray="4 4"
                    />

                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "#59627a",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />

                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{
                        fill: "#9aa1b3",
                        fontSize: 9,
                      }}
                    />

                    <Radar
                      name="Wellness"
                      dataKey="score"
                      stroke="#7c3aed"
                      fill="#8b5cf6"
                      fillOpacity={0.35}
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: "#22c1c3",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#7c3aed",
                        stroke: "#ffffff",
                        strokeWidth: 3,
                      }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Math.round(
                          value
                        )}/100`,
                        "Wellness",
                      ]}
                      contentStyle={{
                        borderRadius: "14px",
                        border:
                          "1px solid rgba(139,92,246,0.15)",
                        background:
                          "rgba(255,255,255,0.97)",
                        boxShadow:
                          "0 10px 30px rgba(70,60,110,0.14)",
                      }}
                    />

                  </RadarChart>

                </ResponsiveContainer>

              </div>

              {/* ==================================================
                  RADAR INSIGHTS
              ================================================== */}

              <div className="premium-bottom-insight">

                <div className="premium-insight-item radar-purple">

                  <span className="insight-icon purple">
                    🧠
                  </span>

                  <div>

                    <strong>
                      Mental Wellness
                    </strong>

                    <small>
                      Mood and emotional wellbeing
                    </small>

                  </div>

                </div>

                <div className="premium-insight-item radar-blue">

                  <span className="insight-icon cyan">
                    😴
                  </span>

                  <div>

                    <strong>
                      Sleep Quality
                    </strong>

                    <small>
                      Recent sleep performance
                    </small>

                  </div>

                </div>

                <div className="premium-insight-item radar-green">

                  <span className="insight-icon green">
                    🥗
                  </span>

                  <div>

                    <strong>
                      Nutrition & Hydration
                    </strong>

                    <small>
                      Daily food and water balance
                    </small>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ====================================================
              LATEST WELLNESS SNAPSHOT
          ==================================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <p className="section-eyebrow">
                YOUR LATEST DATA
              </p>

              <h2>
                Wellness Snapshot
              </h2>

              <p>
                A quick view of the information
                MindNutri currently knows about you.
              </p>

            </div>

            <div className="snapshot-grid">

              {/* STRESS SNAPSHOT */}

              <div className="snapshot-card">

                <div className="snapshot-icon">
                  {getStressEmoji()}
                </div>

                <div>

                  <span>
                    Stress
                  </span>

                  <strong>
                    {stressResult
                      ? getStressLevel()
                      : "Not assessed"}
                  </strong>

                  <small>
                    {stressResult
                      ? `Score ${
                          getStressScore() ??
                          "--"
                        } / 10`
                      : "Take the assessment"}
                  </small>

                </div>

              </div>

              {/* MOOD SNAPSHOT */}

              <div className="snapshot-card">

                <div className="snapshot-icon">
                  {getMoodEmoji()}
                </div>

                <div>

                  <span>
                    Mood
                  </span>

                  <strong>
                    {moodResult
                      ? moodResult.emotion
                      : "Not recorded"}
                  </strong>

                  <small>
                    {moodResult
                      ? `Score ${
                          moodResult.moodScore
                        } / 100`
                      : "Write a journal entry"}
                  </small>

                </div>

              </div>

              {/* WELLNESS SNAPSHOT */}

              <div className="snapshot-card">

                <div className="snapshot-icon">
                  🌿
                </div>

                <div>

                  <span>
                    Overall Wellness
                  </span>

                  <strong>
                    {wellnessScore !== null
                      ? `${wellnessScore}/100`
                      : "Not available"}
                  </strong>

                  <small>
                    {getWellnessStatus()}
                  </small>

                </div>

              </div>

            </div>

          </section>

          {/* ====================================================
              LATEST STRESS DETAILS
          ==================================================== */}

          {stressResult && (
            <section className="dashboard-section">

              <div className="section-heading">

                <p className="section-eyebrow">
                  LATEST ASSESSMENT
                </p>

                <h2>
                  Stress Assessment Result
                </h2>

                <p>
                  Your most recent stress prediction
                  from the local ML model.
                </p>

              </div>

              <div
                className={`latest-stress-card ${getStressClass()}`}
              >

                <div className="latest-stress-main">

                  <div className="large-stress-icon">
                    {getStressEmoji()}
                  </div>

                  <div>

                    <span>
                      CURRENT STRESS LEVEL
                    </span>

                    <h3>
                      {getStressLevel()}
                    </h3>

                    <p>
                      Stress Score:{" "}
                      <strong>
                        {getStressScore() ??
                          "--"}/10
                      </strong>
                    </p>

                  </div>

                </div>

                <div className="stress-meta">

                  {stressResult.confidence !==
                    undefined && (
                    <div>

                      <span>
                        Confidence
                      </span>

                      <strong>
                        {
                          stressResult.confidence
                        }%
                      </strong>

                    </div>
                  )}

                  {stressResult.date && (
                    <div>

                      <span>
                        Assessed
                      </span>

                      <strong>
                        {stressResult.date}
                      </strong>

                    </div>
                  )}

                </div>

                {stressResult.assessment && (
                  <div className="stress-details">

                    <div>
                      😴

                      <span>
                        Sleep
                      </span>

                      <strong>
                        {
                          stressResult
                            .assessment
                            .sleepDuration
                        }
                      </strong>

                    </div>

                    <div>
                      🌙

                      <span>
                        Sleep Quality
                      </span>

                      <strong>
                        {
                          stressResult
                            .assessment
                            .sleepQuality
                        }
                      </strong>

                    </div>

                    <div>
                      🏃

                      <span>
                        Activity
                      </span>

                      <strong>
                        {
                          stressResult
                            .assessment
                            .activityLevel
                        }
                      </strong>

                    </div>

                    <div>
                      ❤️

                      <span>
                        Heart Rate
                      </span>

                      <strong>
                        {
                          stressResult
                            .assessment
                            .heartRate ||
                          "--"
                        }{" "}
                        BPM
                      </strong>

                    </div>

                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/stress-assessment"
                    )
                  }
                >
                  Retake Assessment →
                </button>

              </div>

            </section>
          )}

          {/* ====================================================
              EMPTY STATE
          ==================================================== */}

          {!stressResult && !moodResult && (
            <section className="getting-started-card">

              <div className="getting-started-icon">
                🌱
              </div>

              <div>

                <p className="section-eyebrow">
                  YOUR JOURNEY STARTS HERE
                </p>

                <h2>
                  Let's understand how you're doing.
                </h2>

                <p>
                  Start with either a stress assessment
                  or a mood journal. MindNutri will use
                  your results to create a more
                  personalized wellness experience.
                </p>

                <div className="getting-started-actions">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/stress-assessment"
                      )
                    }
                  >
                    🧠 Check My Stress
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/mood-journal"
                      )
                    }
                  >
                    💭 Write a Journal
                  </button>

                </div>

              </div>

            </section>
          )}

          {/* ====================================================
              WELLNESS NOTICE
          ==================================================== */}

          <div className="dashboard-notice">

            <span>
              ⓘ
            </span>

            <p>
              MindNutri provides educational wellness
              analytics, predictive estimates and
              lifestyle guidance. It is not a substitute
              for professional medical diagnosis or
              treatment.
            </p>

          </div>

        </main>
      )}
    </div>
  );
}

export default Dashboard;