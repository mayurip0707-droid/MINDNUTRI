import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./MenstrualWellness.css";

const PROFILE_KEY = "mindnutri_user_profile";
const PERIOD_KEY = "mindnutri_menstrual_history";
const SYMPTOM_KEY = "mindnutri_menstrual_symptoms";

const SYMPTOM_OPTIONS = [
  "Cramps",
  "Bloating",
  "Headache",
  "Fatigue",
  "Back pain",
  "Mood changes",
  "Breast tenderness",
  "Nausea",
  "Acne",
  "Food cravings",
  "Other",
];

const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"];

const pad = (value) => String(value).padStart(2, "0");

const formatLocalDate = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const parseLocalDate = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getToday = () => formatLocalDate(new Date());

const differenceInDays = (start, end) => {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);

  if (!startDate || !endDate) return 0;

  return Math.round(
    (endDate.getTime() - startDate.getTime()) / 86400000
  );
};

const addDaysToDate = (dateString, days) => {
  const date = parseLocalDate(dateString);

  if (!date) return "";

  date.setDate(date.getDate() + Number(days));

  return formatLocalDate(date);
};

const formatDisplayDate = (dateString) => {
  const date = parseLocalDate(dateString);

  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatShortDate = (dateString) => {
  const date = parseLocalDate(dateString);

  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const clamp = (value, min, max) =>
  Math.min(Math.max(Number(value) || 0, min), max);

const getAverage = (values) => {
  const valid = values.filter(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0
  );

  if (!valid.length) return 0;

  return Math.round(
    valid.reduce((sum, value) => sum + Number(value), 0) / valid.length
  );
};

function MenstrualWellness() {
  const navigate = useNavigate();

  const [isFemaleUser, setIsFemaleUser] = useState(false);
  const [profile, setProfile] = useState(null);

  const [periodHistory, setPeriodHistory] = useState([]);
  const [symptomHistory, setSymptomHistory] = useState([]);

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodError, setPeriodError] = useState("");
  const [periodSuccess, setPeriodSuccess] = useState("");

  const [symptomDate, setSymptomDate] = useState(getToday());
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [symptomSeverity, setSymptomSeverity] = useState("Mild");
  const [symptomNote, setSymptomNote] = useState("");
  const [symptomError, setSymptomError] = useState("");
  const [symptomSuccess, setSymptomSuccess] = useState("");

  const [chartMode, setChartMode] = useState("cycle");
  const [showAllHistory, setShowAllHistory] = useState(false);

  /* -------------------------------------------------------
     LOAD PROFILE + PERIODS + SYMPTOMS
  ------------------------------------------------------- */

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_KEY);

      if (!storedProfile) {
        navigate("/dashboard");
        return;
      }

      const parsedProfile = JSON.parse(storedProfile);

      const female =
        String(parsedProfile?.gender || "").toLowerCase() === "female";

      if (!female) {
        navigate("/dashboard");
        return;
      }

      setProfile(parsedProfile);
      setIsFemaleUser(true);

      const storedPeriods = localStorage.getItem(PERIOD_KEY);
      const parsedPeriods = storedPeriods
        ? JSON.parse(storedPeriods)
        : [];

      const sortedPeriods = Array.isArray(parsedPeriods)
        ? [...parsedPeriods].sort(
            (a, b) =>
              parseLocalDate(b.startDate) -
              parseLocalDate(a.startDate)
          )
        : [];

      setPeriodHistory(sortedPeriods);

      const storedSymptoms = localStorage.getItem(SYMPTOM_KEY);
      const parsedSymptoms = storedSymptoms
        ? JSON.parse(storedSymptoms)
        : [];

      const sortedSymptoms = Array.isArray(parsedSymptoms)
        ? [...parsedSymptoms].sort(
            (a, b) =>
              parseLocalDate(b.date) -
              parseLocalDate(a.date)
          )
        : [];

      setSymptomHistory(sortedSymptoms);
    } catch (error) {
      console.error("Unable to load menstrual data:", error);
      navigate("/dashboard");
    }
  }, [navigate]);

  /* -------------------------------------------------------
     PERSONAL MENSTRUAL CALCULATIONS
  ------------------------------------------------------- */

  const calculatedCycles = useMemo(() => {
    if (!periodHistory.length) return [];

    const sortedOldestFirst = [...periodHistory].sort(
      (a, b) =>
        parseLocalDate(a.startDate) -
        parseLocalDate(b.startDate)
    );

    return sortedOldestFirst.map((record, index) => {
      let cycleLength = Number(record.cycleLength) || 0;

      if (!cycleLength && index > 0) {
        cycleLength = differenceInDays(
          sortedOldestFirst[index - 1].startDate,
          record.startDate
        );
      }

      return {
        ...record,
        cycleLength,
      };
    });
  }, [periodHistory]);

  const cycleLengths = useMemo(
    () =>
      calculatedCycles
        .map((record) => Number(record.cycleLength))
        .filter((value) => value >= 15 && value <= 60),
    [calculatedCycles]
  );

  const periodDurations = useMemo(
    () =>
      periodHistory
        .map((record) => Number(record.duration))
        .filter((value) => value >= 1 && value <= 10),
    [periodHistory]
  );

  const averageCycleLength = useMemo(
    () => getAverage(cycleLengths),
    [cycleLengths]
  );

  const averagePeriodDuration = useMemo(
    () => getAverage(periodDurations),
    [periodDurations]
  );

  const latestPeriod = periodHistory[0] || null;

  // At least 3 recorded period starts are needed to estimate
  // a personal cycle length using at least 2 intervals.
  const hasReliableCycleHistory = cycleLengths.length >= 1;

  const estimatedCycleLength = hasReliableCycleHistory
    ? averageCycleLength
    : null;

  const estimatedNextPeriod =
    latestPeriod && estimatedCycleLength
      ? addDaysToDate(
          latestPeriod.startDate,
          estimatedCycleLength
        )
      : "";

  const today = getToday();

  const currentCycleDay = latestPeriod
    ? Math.max(
        1,
        differenceInDays(latestPeriod.startDate, today) + 1
      )
    : 0;

  const isCurrentlyInPeriod = latestPeriod
    ? today >= latestPeriod.startDate &&
      today <= latestPeriod.endDate
    : false;

  const daysUntilNextPeriod = estimatedNextPeriod
    ? differenceInDays(today, estimatedNextPeriod)
    : null;

  const isCycleOverdue =
    Boolean(estimatedNextPeriod) &&
    daysUntilNextPeriod < 0;

  
  const predictionStatus =
    !latestPeriod || !hasReliableCycleHistory || isCycleOverdue
      ? "Uncertain / Insufficient data"
      : cycleLengths.length < 2
        ? "Initial estimate · Low confidence"
        : "Estimated · Based on your history";

    
      
  // Calendar-based ovulation estimate, approximately 14 days
  // before the estimated next period. This cannot confirm ovulation.
  const estimatedOvulationDate = estimatedNextPeriod
    ? addDaysToDate(estimatedNextPeriod, -14)
    : "";

  const ovulationWindowStart = estimatedOvulationDate
    ? addDaysToDate(estimatedOvulationDate, -2)
    : "";

  const ovulationWindowEnd = estimatedOvulationDate
    ? addDaysToDate(estimatedOvulationDate, 2)
    : "";



  /* -------------------------------------------------------
     GRAPH DATA
  ------------------------------------------------------- */

  const chartData = useMemo(() => {
    const sorted = [...calculatedCycles]
      .sort(
        (a, b) =>
          parseLocalDate(a.startDate) -
          parseLocalDate(b.startDate)
      )
      .slice(-6);

    return sorted.map((record, index) => ({
      cycle: `Cycle ${index + 1}`,
      cycleLength:
        Number(record.cycleLength) > 0
          ? Number(record.cycleLength)
          : null,
      duration:
        Number(record.duration) > 0
          ? Number(record.duration)
          : null,
    }));
  }, [calculatedCycles]);

  /* -------------------------------------------------------
     SYMPTOM INSIGHTS
  ------------------------------------------------------- */

  const symptomInsights = useMemo(() => {
    if (!symptomHistory.length) {
      return {
        common: [],
        mostCommon: null,
        severeCount: 0,
      };
    }

    const counts = {};

    symptomHistory.forEach((entry) => {
      const name = entry.symptom || "Other";

      if (!counts[name]) {
        counts[name] = 0;
      }

      counts[name] += 1;
    });

    const total = symptomHistory.length;

    const common = Object.entries(counts)
      .map(([symptom, count]) => ({
        symptom,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      common,
      mostCommon: common[0] || null,
      severeCount: symptomHistory.filter(
        (entry) =>
          String(entry.severity || "").toLowerCase() === "severe"
      ).length,
    };
  }, [symptomHistory]);

  /* -------------------------------------------------------
     PERIOD REGULARITY
  ------------------------------------------------------- */

  const cycleRegularityText = useMemo(() => {
    if (cycleLengths.length < 2) {
      return "More records are needed to understand your cycle pattern.";
    }

    const average =
      cycleLengths.reduce((sum, value) => sum + value, 0) /
      cycleLengths.length;

    const differences = cycleLengths.map((value) =>
      Math.abs(value - average)
    );

    const variation =
      differences.reduce((sum, value) => sum + value, 0) /
      differences.length;

    if (variation <= 2) {
      return `Your recorded cycles are fairly consistent around ${Math.round(
        average
      )} days.`;
    }

    if (variation <= 4) {
      return "Your recorded cycles show some variation from cycle to cycle.";
    }

    return "Your recorded cycle lengths vary noticeably. Continue tracking to understand your personal pattern.";
  }, [cycleLengths]);

  /* -------------------------------------------------------
     CURRENT CYCLE PHASE
  ------------------------------------------------------- */
  
  const cyclePhase = useMemo(() => {
    if (!latestPeriod || !currentCycleDay) {
      return {
        name: "Phase uncertain",
        range: "Insufficient period history",
        description:
          "Record your period dates to begin estimating your cycle phase.",
        progress: 0,
        next: "",
      };
    }

    if (isCurrentlyInPeriod) {
      return {
        name: "Menstrual Phase",
        range: `Day ${currentCycleDay}`,
        description:
          "Based on your recorded period dates. Actual biological changes may differ.",
        progress: 15,
        next: "Follicular Phase",
      };
    }

    if (!hasReliableCycleHistory || !estimatedNextPeriod) {
      return {
        name: "Phase uncertain",
        range: "More cycle history needed",
        description:
          "Add more period start dates. A reliable phase estimate is not available yet.",
        progress: 0,
        next: "",
      };
    }

    if (isCycleOverdue) {
      return {
        name: "Cycle update needed",
        range: "Estimated next period date has passed",
        description:
          "Update your period history. This calendar estimate may no longer be reliable.",
        progress: 0,
        next: "",
      };
    }

    if (
      today < latestPeriod.startDate
    ) {
      return {
        name: "Phase uncertain",
        range: "Check saved period dates",
        description:
          "Your latest saved period starts in the future. Please check your entries.",
        progress: 0,
        next: "",
      };
    }

    if (
      today >= ovulationWindowStart &&
      today <= ovulationWindowEnd
    ) {
      return {
        name: "Estimated Ovulation Window",
        range: `${formatDisplayDate(ovulationWindowStart)} – ${formatDisplayDate(ovulationWindowEnd)}`,
        description:
          "Calendar-based estimate only. Period dates cannot confirm actual ovulation.",
        progress: 60,
        next: "Luteal Phase",
      };
    }

    if (today < ovulationWindowStart) {
      return {
        name: "Follicular Phase",
        range: `Day ${currentCycleDay} • estimated`,
        description:
          "Estimated from your recorded cycle history. Your actual biological phase may differ.",
        progress: clamp(
          (currentCycleDay / Math.max(estimatedCycleLength - 14, 1)) * 45,
          5,
          45
        ),
        next: "Estimated Ovulation Window",
      };
    }

    return {
      name: "Luteal Phase",
      range: `Day ${currentCycleDay} • estimated`,
      description:
        "Estimated from your predicted next period. Actual ovulation and phase cannot be confirmed from dates alone.",
      progress: clamp(
        60 +
          ((currentCycleDay - (estimatedCycleLength - 14)) /
            Math.max(estimatedCycleLength - (estimatedCycleLength - 14), 1)) *
            40,
        60,
        100
      ),
      next: "Next period",
    };
  }, [
    latestPeriod,
    currentCycleDay,
    isCurrentlyInPeriod,
    hasReliableCycleHistory,
    estimatedNextPeriod,
    isCycleOverdue,
    today,
    ovulationWindowStart,
    ovulationWindowEnd,
    estimatedCycleLength,
  ]);


  /* -------------------------------------------------------
     DYNAMIC NUTRITION MESSAGE
  ------------------------------------------------------- */

  const recommendation = useMemo(() => {
    if (isCurrentlyInPeriod) {
      return {
        title: "Nutrition During Your Period",
        subtitle:
          "Support your body with balanced meals and comfortable choices.",
        bullets: [
          "Include iron-rich foods such as dal, beans, leafy greens and nuts.",
          "Include protein with regular meals.",
          "Choose fruits and vegetables for variety.",
          "Stay hydrated throughout the day.",
          "Warm, balanced meals may feel comfortable during this phase.",
        ],
      };
    }

    if (
      daysUntilNextPeriod !== null &&
      daysUntilNextPeriod >= 0 &&
      daysUntilNextPeriod <= 3
    ) {
      return {
        title: "Prepare for Your Period",
        subtitle:
          "Your estimated period is approaching, so focus on balanced nutrition.",
        bullets: [
          "Include iron-rich foods such as leafy greens, lentils and beans.",
          "Include protein-rich foods with your meals.",
          "Eat fresh fruits and vegetables.",
          "Stay hydrated throughout the day.",
          "Keep meals regular and balanced.",
        ],
      };
    }

    return {
      title: "Balanced Nutrition for Your Cycle",
      subtitle:
        "Simple nutrition habits can support your overall wellness.",
      bullets: [
        "Include protein-rich foods.",
        "Eat a variety of fruits and vegetables.",
        "Include whole grains and fibre-rich foods.",
        "Choose iron-rich foods regularly.",
        "Stay hydrated throughout the day.",
      ],
    };
  }, [daysUntilNextPeriod, isCurrentlyInPeriod]);

  /* -------------------------------------------------------
     SAVE PERIOD
  ------------------------------------------------------- */

  const handleSavePeriod = () => {
    setPeriodError("");
    setPeriodSuccess("");

    if (!periodStart || !periodEnd) {
      setPeriodError(
        "Please enter both the period start date and end date."
      );
      return;
    }

    const duration =
      differenceInDays(periodStart, periodEnd) + 1;

    if (duration <= 0) {
      setPeriodError(
        "End date must be on or after the start date."
      );
      return;
    }

    if (duration > 10) {
      setPeriodError(
        "Please enter a period duration of 10 days or less."
      );
      return;
    }

    const duplicate = periodHistory.some(
      (record) =>
        record.startDate === periodStart &&
        record.endDate === periodEnd
    );

    if (duplicate) {
      setPeriodError(
        "This period record already exists."
      );
      return;
    }

    const sortedExisting = [...periodHistory].sort(
      (a, b) =>
        parseLocalDate(b.startDate) -
        parseLocalDate(a.startDate)
    );

    let cycleLength = 0;

    if (sortedExisting.length > 0) {
      const nearestPrevious = sortedExisting.find(
        (record) =>
          parseLocalDate(record.startDate) <
          parseLocalDate(periodStart)
      );

      if (nearestPrevious) {
        const calculated = differenceInDays(
          nearestPrevious.startDate,
          periodStart
        );

        if (calculated >= 15 && calculated <= 60) {
          cycleLength = calculated;
        }
      }
    }

    const newRecord = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      startDate: periodStart,
      endDate: periodEnd,
      duration,
      cycleLength,
      timestamp: new Date().toISOString(),
    };

    const updated = [newRecord, ...periodHistory].sort(
      (a, b) =>
        parseLocalDate(b.startDate) -
        parseLocalDate(a.startDate)
    );

    setPeriodHistory(updated);
    localStorage.setItem(
      PERIOD_KEY,
      JSON.stringify(updated)
    );

    setPeriodStart("");
    setPeriodEnd("");
    setPeriodSuccess(
      "Your period record has been saved successfully."
    );
  };

  const handleDeletePeriod = (id) => {
    const updated = periodHistory.filter(
      (record) => record.id !== id
    );

    setPeriodHistory(updated);
    localStorage.setItem(
      PERIOD_KEY,
      JSON.stringify(updated)
    );
  };

  /* -------------------------------------------------------
     SAVE SYMPTOM
  ------------------------------------------------------- */

  const handleSaveSymptom = () => {
    setSymptomError("");
    setSymptomSuccess("");

    if (!symptomDate) {
      setSymptomError("Please select a date.");
      return;
    }

    if (!selectedSymptom) {
      setSymptomError("Please select a symptom.");
      return;
    }

    if (!symptomSeverity) {
      setSymptomError("Please select severity.");
      return;
    }

    const newSymptom = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      date: symptomDate,
      symptom: selectedSymptom,
      severity: symptomSeverity,
      note: symptomNote.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [newSymptom, ...symptomHistory].sort(
      (a, b) =>
        parseLocalDate(b.date) -
        parseLocalDate(a.date)
    );

    setSymptomHistory(updated);

    localStorage.setItem(
      SYMPTOM_KEY,
      JSON.stringify(updated)
    );

    setSelectedSymptom("");
    setSymptomSeverity("Mild");
    setSymptomNote("");
    setSymptomSuccess(
      "Your symptom entry has been saved."
    );
  };

  const handleDeleteSymptom = (id) => {
    const updated = symptomHistory.filter(
      (entry) => entry.id !== id
    );

    setSymptomHistory(updated);

    localStorage.setItem(
      SYMPTOM_KEY,
      JSON.stringify(updated)
    );
  };

  /* -------------------------------------------------------
     REMINDER
  ------------------------------------------------------- */

  const reminder = useMemo(() => {
    if (!estimatedNextPeriod) {
      return {
        type: "empty",
        title: "Start tracking your cycle",
        text:
          "Add your period dates to receive your personal cycle estimate.",
      };
    }

    if (daysUntilNextPeriod < 0) {
      return {
        type: "late",
        title: "Your period may be later than estimated",
        text:
          "Period dates can naturally vary. Continue with balanced meals, hydration and adequate rest.",
      };
    }

    if (daysUntilNextPeriod <= 3) {
      return {
        type: "soon",
        title: "Your period is approaching!",
        text: `Estimated in ${daysUntilNextPeriod} day${
          daysUntilNextPeriod === 1 ? "" : "s"
        } (${formatDisplayDate(estimatedNextPeriod)}).`,
      };
    }

    return {
      type: "normal",
      title: "Your next period is being tracked",
      text: `Estimated on ${formatDisplayDate(
        estimatedNextPeriod
      )}.`,
    };
  }, [daysUntilNextPeriod, estimatedNextPeriod]);

  if (!isFemaleUser) {
    return null;
  }

  const visibleHistory = showAllHistory
    ? periodHistory
    : periodHistory.slice(0, 5);

  const visibleSymptoms = symptomHistory.slice(0, 5);

  const displayCommonSymptoms = symptomInsights.common.slice(
    0,
    5
  );

  const maxSymptomPercentage =
    displayCommonSymptoms.length > 0
      ? Math.max(
          ...displayCommonSymptoms.map(
            (item) => item.percentage
          )
        )
      : 1;

      
    // Scroll to a section and temporarily highlight it
    const scrollToAndHighlight = (sectionId) => {
      const target = document.getElementById(sectionId);

      if (!target) {
        console.warn(`Menstrual Wellness section not found: ${sectionId}`);
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      target.classList.remove("mn-highlight-target");

      // Restart the highlight animation on repeated clicks
      void target.offsetWidth;

      target.classList.add("mn-highlight-target");

      window.setTimeout(() => {
        target.classList.remove("mn-highlight-target");
      }, 2500);
    };


  return (
    <div className="menstrual-page">

      {/* -------------------------------------------------
          MAIN CONTENT
      ------------------------------------------------- */}

      <main className="menstrual-main">
        {/* TOP BAR */}

        <header className="mn-topbar">
          <div />

          <div className="mn-user-area">
            <button className="mn-icon-button">♧</button>

            <div className="mn-user-divider" />

            <div className="mn-avatar">
              {profile?.fullName
                ? profile.fullName
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div className="mn-user-text">
              <span>Welcome,</span>
              <strong>
                {profile?.fullName || "User"}
              </strong>
            </div>

            <span className="mn-chevron">⌄</span>
          </div>
        </header>

        {/* HERO */}

        <section className="mn-hero">
          <div className="mn-hero-content">
            <div className="mn-hero-title-row">
              <span className="mn-flower-icon">✿</span>

              <div>
                <h1>Menstrual Wellness</h1>

                <p>
                  Track your cycle, get personalized insights
                  and follow simple nutrition tips for a
                  healthier, happier you.
                </p>
              </div>
            </div>
          </div>

          <div className="mn-hero-art">
            <div className="mn-hero-leaf leaf-one">
              ♧
            </div>

            <div className="mn-hero-person">
              ♡
            </div>

            <div className="mn-hero-flower flower-one">
              ✿
            </div>

            <div className="mn-hero-flower flower-two">
              ✿
            </div>
          </div>

          <div className="mn-hero-quote">
            <span>Better nutrition</span>
            <span>Balanced hormones</span>
            <span>
              A healthier you <b>♥</b>
            </span>
          </div>
          
        </section>

        {/* SUMMARY CARDS */}

        <section className="mn-summary-grid">
          <div
            className="mn-summary-card pink-card"
            role="button"
            tabIndex={0}
            onClick={() => scrollToAndHighlight("period-history-section")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToAndHighlight("period-history-section");
              }
            }}
          >
            <div className="mn-summary-icon pink">
              ▣
            </div>

            <div className="mn-summary-label">
              Last Period
            </div>

            <strong>
              {latestPeriod
                ? `${formatDisplayDate(
                    latestPeriod.startDate
                  )} – ${formatDisplayDate(
                    latestPeriod.endDate
                  )}`
                : "No record yet"}
            </strong>

            <small>
              {latestPeriod
                ? `Duration: ${latestPeriod.duration} days`
                : "Add your first period record"}
            </small>

            <span className="mn-summary-arrow">›</span>
          </div>

          <div
            className="mn-summary-card blue-card"
            role="button"
            tabIndex={0}
            onClick={() => scrollToAndHighlight("upcoming-reminder-section")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToAndHighlight("upcoming-reminder-section");
              }
            }}
          >
            <div className="mn-summary-icon blue">
              ▣
            </div>

            <div className="mn-summary-label">
              Estimated Next Period
            </div>

            <strong>
              {estimatedNextPeriod
                ? formatDisplayDate(estimatedNextPeriod)
                : "—"}
            </strong>

            <small>
              {daysUntilNextPeriod !== null
                ? daysUntilNextPeriod >= 0
                  ? `In ${daysUntilNextPeriod} day${
                      daysUntilNextPeriod === 1
                        ? ""
                        : "s"
                    }`
                  : `${Math.abs(
                      daysUntilNextPeriod
                    )} days later than estimate`
                : "Track more data"}
            </small>

            <span className="mn-summary-arrow">
              ›
            </span>
          </div>

          <div
            className="mn-summary-card green-card"
            role="button"
            tabIndex={0}
            onClick={() => scrollToAndHighlight("menstrual-pattern-section")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToAndHighlight("menstrual-pattern-section");
              }
            }}
          >
            <div className="mn-summary-icon green">
              ⟳
            </div>

            <div className="mn-summary-label">
              Average Cycle Length
            </div>

            <strong>
              {averageCycleLength
                ? `${averageCycleLength} days`
                :  "Insufficient data"}
            </strong>

            <small>
              {averageCycleLength
                ? "(Based on your recorded cycles)"
                : "(Record more periods to estimate)"}
            </small>

            <span className="mn-summary-arrow">
              ›
            </span>
          </div>

          <div
            className="mn-summary-card rose-card"
            role="button"
            tabIndex={0}
            onClick={() => scrollToAndHighlight("cycle-insights-section")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToAndHighlight("cycle-insights-section");
              }
            }}
          >
            <div className="mn-summary-icon rose">
              ◉
            </div>

            <div className="mn-summary-label">
              Average Period Duration
            </div>

            <strong>
              {averagePeriodDuration
                ? `${averagePeriodDuration} days`
                : "—"}
            </strong>

            <small>
              {averagePeriodDuration
                ? "(Based on your records)"
                : "Based on your saved periods"}
            </small>

            <span className="mn-summary-arrow">
              ›
            </span>
          </div>
        </section>

        {/* GRAPH + INSIGHTS */}

        <section className="mn-pattern-grid">
          <div
            className="mn-card mn-pattern-card"
            id="menstrual-pattern-section"
          >
            <div className="mn-card-header">
              <div className="mn-card-title-wrap">
                <div className="mn-section-icon pink-icon">
                  ↗
                </div>

                <div>
                  <h2>Your Menstrual Pattern</h2>
                  <p>
                    See how your cycle has changed over time.
                  </p>
                </div>
              </div>

              <div className="mn-chart-toggle">
                <button
                  className={
                    chartMode === "cycle"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setChartMode("cycle")
                  }
                >
                  Cycle Length
                </button>

                <button
                  className={
                    chartMode === "duration"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setChartMode("duration")
                  }
                >
                  Period Duration
                </button>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="mn-chart">
                <ResponsiveContainer
                  width="100%"
                  height={285}
                >
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 15,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#edf0f7"
                      vertical={true}
                      horizontal={true}
                    />

                    <XAxis
                      dataKey="cycle"
                      tick={{
                        fill: "#5c6384",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#5c6384",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, "auto"]}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #eee",
                        boxShadow:
                          "0 10px 30px rgba(50,50,80,.08)",
                      }}
                      formatter={(value) => [
                        `${value} days`,
                        chartMode === "cycle"
                          ? "Cycle Length"
                          : "Period Duration",
                      ]}
                    />

                    {chartMode === "cycle" ? (
                      <Line
                        type="monotone"
                        dataKey="cycleLength"
                        stroke="#6f43d6"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: "#6f43d6",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{
                          r: 7,
                        }}
                        connectNulls={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="#f23f88"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: "#f23f88",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{
                          r: 7,
                        }}
                        connectNulls={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mn-empty-chart">
                <div>♡</div>

                <strong>
                  Your menstrual pattern will appear here
                </strong>

                <p>
                  Add period records to build your
                  personal cycle graph.
                </p>
              </div>
            )}

            <div className="mn-chart-legend">
              <span>
                <i className="purple-dot" />
                Cycle Length
              </span>

              <span>
                <i className="pink-dot" />
                Period Duration
              </span>
            </div>
          </div>

          <div
            className="mn-card mn-insights-card"
            id="cycle-insights-section"
          >
            <div className="mn-card-title-wrap">
              <div className="mn-section-icon lavender-icon">
                ♧
              </div>

              <div>
                <h2>Cycle Insights</h2>
                <p>Based on your saved records.</p>
              </div>
            </div>

            <div className="mn-insight-list">
              <div className="mn-insight-row">
                <span>✓</span>

                <p>{cycleRegularityText}</p>
              </div>

              <div className="mn-insight-row">
                <span>✓</span>

                <p>
                  {averagePeriodDuration
                    ? `Your period typically lasts around ${averagePeriodDuration} days.`
                    : "Your average period duration will appear after tracking more records."}
                </p>
              </div>

              <div className="mn-insight-row">
                <span>✓</span>

                <p>
                  {latestPeriod
                    ? `Your last period started on ${formatDisplayDate(
                        latestPeriod.startDate
                      )}.`
                    : "Your last period will appear here."}
                </p>
              </div>

              <div className="mn-insight-row">
                <span>✓</span>

                <p>
                  {estimatedNextPeriod
                    ? `Your next period is estimated around ${formatDisplayDate(
                        estimatedNextPeriod
                      )}.`
                    : "Track your cycle to receive an estimate."}
                </p>
              </div>
            </div>

            <button
              className="mn-text-link"
              onClick={() =>
                document
                  .getElementById(
                    "period-history-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              <h3>View detailed insights →</h3>
            </button>
          </div>
        </section>

        {/* REMINDER / RECOMMENDATION / PHASE */}

        {/* =========================================================
            UPCOMING REMINDER / RECOMMENDATION / CYCLE PHASE
        ========================================================= */}

        <section className="mn-reference-three-grid">

            {/* ================= UPCOMING REMINDER ================= */}

            <div
              className="mn-ref-card mn-ref-reminder"
              id="upcoming-reminder-section"
            >

                <div className="mn-ref-header">
                    <div className="mn-ref-icon reminder-ref-icon">
                        🔔
                    </div>

                    <h3>Upcoming Reminder</h3>
                </div>

                <div className="mn-ref-reminder-content">

                    <div className="mn-ref-reminder-text">

                        <h4
                            className={
                                reminder.type === "late"
                                    ? "mn-ref-late-title"
                                    : "mn-ref-pink-title"
                            }
                        >
                            {reminder.title}
                        </h4>

                        <p className="mn-ref-main-text">
                            {reminder.text}
                        </p>

                        {reminder.type === "soon" && (
                            <p className="mn-ref-description">
                            Focus on balanced meals, iron-rich foods,
                            water and enough rest for a comfortable cycle.
                            </p>
                        )}

                        {reminder.type === "late" && (
                            <p className="mn-ref-description">
                                There is no specific food that can reliably
                                make a late period start immediately.
                                Continue your normal balanced routine.
                            </p>
                        )}

                        <button
                            className="mn-ref-button"
                            onClick={() =>
                                document
                                .getElementById("nutrition-guidance")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                })
                            }
                        >
                            View Food Guide <span>→</span>
                        </button>

                    </div>

                    {/* Decorative calendar visual */}
                    <div className="mn-ref-calendar">
                        <div className="mn-ref-calendar-top"></div>

                        <div className="mn-ref-calendar-body">
                            <div className="mn-ref-calendar-date">
                                {latestPeriod
                                ? formatDisplayDate(latestPeriod.startDate).split(" ")[0]
                                : "—"}
                            </div>

                            <div className="mn-ref-flower">
                                🌸
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            {/* ================= TODAY'S RECOMMENDATION ================= */}

            <div className="mn-ref-card mn-ref-recommendation">

                <div className="mn-ref-header">
                    <div className="mn-ref-icon food-ref-icon">
                        🍴
                    </div>

                    <h3>Today's Recommendation</h3>
                </div>

                <div className="mn-ref-recommendation-content">

                    <div className="mn-ref-recommendation-text">

                        <h4>
                            {recommendation.title}
                        </h4>

                        <p className="mn-ref-subtitle">
                            {recommendation.subtitle}
                        </p>

                        <div className="mn-ref-check-list">

                            {recommendation.bullets
                                .slice(0, 4)
                                .map((bullet, index) => (
                                  <div
                                    className="mn-ref-check-row"
                                    key={index}
                                  >
                                    <span className="mn-ref-check">
                                        ✓
                                    </span>

                                    <p>{bullet}</p>
                                </div>
                                ))}

                            </div>

                        </div>


                {/* Decorative food illustration */}
                <div className="mn-ref-food-visual">

                    <div className="mn-ref-fruit fruit-a">
                        🍊
                    </div>

                    <div className="mn-ref-fruit fruit-b">
                        🍎
                    </div>

                    <div className="mn-ref-fruit fruit-c">
                        🥕
                    </div>

                    <div className="mn-ref-water">
                        💧
                    </div>

                    <div className="mn-ref-bowl">
                        🥗
                    </div>

                  </div>

                </div>

                <button
                    className="mn-ref-button recommendation-ref-button"
                    onClick={() =>
                        document
                        .getElementById("nutrition-guidance")
                        ?.scrollIntoView({
                            behavior: "smooth",
                        })
                    }
                >
                    View Food Suggestions <span>→</span>
                </button>

            </div>


            {/* ================= CYCLE PHASE ================= */}

            <div className="mn-ref-card mn-ref-phase">

                <div className="mn-ref-header">
                    <div className="mn-ref-icon phase-ref-icon">
                        📅
                    </div>

                    <h3>Cycle Phase</h3>
                </div>

                <h4 className="mn-ref-phase-title">
                    {cyclePhase.name}
                </h4>
                
                <small
                  className={
                    predictionStatus.startsWith("Estimated") ||
                    predictionStatus.startsWith("Initial estimate")
                      ? "cycle-prediction-status estimated"
                      : "cycle-prediction-status uncertain"
                  }
                >
                  {predictionStatus}
                </small>

                <p className="mn-ref-phase-range">
                {cyclePhase.range}
                </p>

                <p className="mn-ref-phase-description">
                    {cyclePhase.description}
                </p>


                {/* Phase timeline */}
                <div className="mn-ref-phase-timeline">

                    <div className="mn-ref-phase-line"></div>

                    <div
                        className="mn-ref-phase-fill"
                        style={{
                        width: `${Math.min(
                            Math.max(Number(cyclePhase.progress) || 0, 0),
                            100
                        )}%`,
                        }}
                    ></div>

                    <span className="mn-ref-phase-dot dot-1"></span>
                    <span className="mn-ref-phase-dot dot-2"></span>
                    <span className="mn-ref-phase-dot dot-3"></span>
                    <span className="mn-ref-phase-dot dot-4"></span>
                    <span className="mn-ref-phase-dot dot-5"></span>
                    <span className="mn-ref-phase-dot dot-6"></span>
                    <span className="mn-ref-phase-dot dot-7"></span>

                    <span
                        className="mn-ref-current-phase"
                        style={{
                        left: `${Math.min(
                            Math.max(Number(cyclePhase.progress) || 0, 5),
                            95
                        )}%`,
                        }}
                    ></span>

                </div>


                <div className="mn-ref-next-phase">
                    <span>Next phase:</span>

                    <strong>
                        {cyclePhase.next || "Continue tracking"}
                    </strong>
                </div>

            </div>

        </section>
        {/* FOOD + LATE PERIOD */}

        <section
          className="mn-food-grid"
          id="nutrition-guidance"
        >
          <div className="mn-card food-guidance-card">
            <div className="mn-small-header">
              <div className="mn-section-icon green-icon">
                ♧
              </div>

              <h3>What to Eat & Avoid</h3>
            </div>

            <div className="mn-food-columns">
              <div className="mn-food-column eat-column">
                <div className="mn-food-column-title">
                  <span>♧</span>
                  Eat More
                </div>

                <ul>
                  <li>
                    Leafy greens such as spinach and kale
                  </li>

                  <li>
                    Iron-rich foods such as dal, beans and
                    nuts
                  </li>

                  <li>
                    Fruits such as banana, berries and citrus
                  </li>

                  <li>
                    Whole grains such as oats and brown rice
                  </li>

                  <li>
                    Hydration such as water and coconut water
                  </li>
                </ul>

                <div className="mn-food-decor">
                  🥬 🍎 🥜
                </div>
              </div>

              <div className="mn-food-column limit-column">
                <div className="mn-food-column-title">
                  <span>×</span>
                  Limit If You Notice Symptoms
                </div>

                <ul>
                  <li>Excess caffeine</li>

                  <li>Very salty or heavily processed foods</li>

                  <li>Sugary foods and drinks</li>

                  <li>Alcohol</li>

                  <li>Junk food</li>
                </ul>

                <div className="mn-food-decor">
                  ☕ 🍟 🍩
                </div>
              </div>
            </div>
          </div>

          <div className="mn-card late-card">
            <div className="mn-small-header">
              <div className="mn-section-icon late-icon">
                ◷
              </div>

              <h3>If Your Period Is Late</h3>
            </div>

            <h4>
              Your period is later than the estimated
              date?
            </h4>

            <p>
              Period dates can naturally vary. Continue
              with balanced meals, hydration and adequate
              rest.
            </p>

            <p>
              If your periods are repeatedly irregular or
              you miss several periods, consider speaking
              with a qualified healthcare professional.
            </p>

            <button
              className="mn-pink-button"
              onClick={() =>
                document
                  .getElementById(
                    "quick-tips-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              View Tips →
            </button>

            <div className="mn-late-decoration">
              ♡
            </div>
          </div>
        </section>

        {/* PERIOD HISTORY */}

        <section
          className="mn-bottom-grid"
          id="period-history-section"
        >
          <div className="mn-card history-card">
            <div className="mn-small-header">
              <div className="mn-section-icon purple-icon">
                ▣
              </div>

              <h3>Period History</h3>

              {periodHistory.length > 5 && (
                <button
                  className="mn-view-all"
                  onClick={() =>
                    setShowAllHistory(
                      !showAllHistory
                    )
                  }
                >
                  {showAllHistory
                    ? "Show Less"
                    : "View All →"}
                </button>
              )}
            </div>

            <p className="mn-history-subtitle">
              Your Recent Records
            </p>

            {visibleHistory.length > 0 ? (
              <div className="mn-history-list">
                {visibleHistory.map((record) => (
                  <div
                    className="mn-history-row"
                    key={record.id}
                  >
                    <div className="mn-history-date-icon">
                      ◉
                    </div>

                    <div className="mn-history-date">
                      {formatShortDate(
                        record.startDate
                      )}{" "}
                      –{" "}
                      {formatShortDate(
                        record.endDate
                      )}
                    </div>

                    <strong>
                      {record.duration} days
                    </strong>

                    <button
                      className="mn-delete-small"
                      onClick={() =>
                        handleDeletePeriod(
                          record.id
                        )
                      }
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mn-small-empty">
                No period records yet.
              </div>
            )}

            <div className="mn-period-entry">
              <h4>Add Period Record</h4>

              <div className="mn-period-form">
                <label>
                  Start Date
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(event) =>
                      setPeriodStart(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(event) =>
                      setPeriodEnd(
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {periodError && (
                <div className="mn-error">
                  {periodError}
                </div>
              )}

              {periodSuccess && (
                <div className="mn-success">
                  {periodSuccess}
                </div>
              )}

              <button
                className="mn-pink-button full-width"
                onClick={handleSavePeriod}
              >
                Save Period Record
              </button>
            </div>
          </div>

          {/* SYMPTOM SUMMARY */}

          <div
            className="mn-card symptom-summary-card"
            id="symptoms-section"
          >
            <div className="mn-small-header">
              <div className="mn-section-icon symptom-icon">
                ♡
              </div>

              <h3>Symptoms Tracker</h3>
            </div>

            <p className="mn-history-subtitle">
              Your Most Common Symptoms
            </p>

            {displayCommonSymptoms.length > 0 ? (
              <div className="mn-symptom-bars">
                {displayCommonSymptoms.map(
                  (item, index) => (
                    <div
                      className="mn-symptom-bar-row"
                      key={item.symptom}
                    >
                      <div className="mn-symptom-bar-label">
                        <span>{item.symptom}</span>
                        <strong>
                          {item.percentage}%
                        </strong>
                      </div>

                      <div className="mn-bar-track">
                        <span
                          className={`symptom-bar-color color-${index}`}
                          style={{
                            width: `${
                              (item.percentage /
                                maxSymptomPercentage) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="mn-small-empty">
                Start tracking symptoms to see your
                personal pattern.
              </div>
            )}

            <button
              className="mn-pink-button"
              onClick={() =>
                document
                  .getElementById(
                    "symptom-entry-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Track Symptoms →
            </button>
          </div>

          {/* QUICK TIPS */}

          <div
            className="mn-card quick-tips-card"
            id="quick-tips-section"
          >
            <div className="mn-small-header">
              <div className="mn-section-icon tip-icon">
                ♧
              </div>

              <h3>Quick Tips</h3>
            </div>

            <div className="mn-tip-list">
              <div>
                <span>▣</span>
                Get 7–9 hours of sleep
              </div>

              <div>
                <span>♧</span>
                Manage stress with breathing or yoga
              </div>

              <div>
                <span>♧</span>
                Stay active with light exercise
              </div>

              <div>
                <span>▣</span>
                Use a heating pad for cramps if helpful
              </div>

              <div>
                <span>▣</span>
                Keep a period journal
              </div>
            </div>

            <div className="mn-quick-quote">
              <span>Small steps</span>
              <br />
              make a big difference
              <b> ♥</b>
            </div>
          </div>
        </section>

        {/* FULL SYMPTOM TRACKER */}

        <section
          className="mn-card full-symptom-card"
          id="symptom-entry-section"
        >
          <div className="mn-symptom-layout">
            <div className="mn-symptom-form-area">
              <div className="mn-small-header">
                <div className="mn-section-icon symptom-icon">
                  ♡
                </div>

                <div>
                  <h3>How Are You Feeling?</h3>

                  <p>
                    Record symptoms and their severity to
                    understand your personal pattern.
                  </p>
                </div>
              </div>

              <div className="mn-symptom-form-grid">
                <label>
                  Date
                  <input
                    type="date"
                    value={symptomDate}
                    onChange={(event) =>
                      setSymptomDate(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Symptom
                  <select
                    value={selectedSymptom}
                    onChange={(event) =>
                      setSelectedSymptom(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select symptom
                    </option>

                    {SYMPTOM_OPTIONS.map(
                      (symptom) => (
                        <option
                          key={symptom}
                          value={symptom}
                        >
                          {symptom}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Severity
                  <select
                    value={symptomSeverity}
                    onChange={(event) =>
                      setSymptomSeverity(
                        event.target.value
                      )
                    }
                  >
                    {SEVERITY_OPTIONS.map(
                      (severity) => (
                        <option
                          key={severity}
                          value={severity}
                        >
                          {severity}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <label className="mn-note-label">
                Optional Note
                <textarea
                  value={symptomNote}
                  maxLength={300}
                  placeholder="Example: Mild discomfort in the evening..."
                  onChange={(event) =>
                    setSymptomNote(
                      event.target.value
                    )
                  }
                />
              </label>

              {symptomError && (
                <div className="mn-error">
                  {symptomError}
                </div>
              )}

              {symptomSuccess && (
                <div className="mn-success">
                  {symptomSuccess}
                </div>
              )}

              <button
                className="mn-pink-button"
                onClick={handleSaveSymptom}
              >
                Save Symptom
              </button>
            </div>

            <div className="mn-recent-symptoms">
              <h3>Recent Symptoms</h3>

              {visibleSymptoms.length > 0 ? (
                <div className="mn-recent-symptom-list">
                  {visibleSymptoms.map(
                    (entry) => (
                      <div
                        className="mn-recent-symptom-row"
                        key={entry.id}
                      >
                        <div className="mn-symptom-circle">
                          ♡
                        </div>

                        <div>
                          <strong>
                            {entry.symptom}
                          </strong>

                          <span>
                            {formatDisplayDate(
                              entry.date
                            )}
                          </span>

                          {entry.note && (
                            <small>
                              {entry.note}
                            </small>
                          )}
                        </div>

                        <div
                          className={`mn-severity ${
                            String(
                              entry.severity || ""
                            ).toLowerCase()
                          }`}
                        >
                          {entry.severity}
                        </div>

                        <button
                          className="mn-delete-small"
                          onClick={() =>
                            handleDeleteSymptom(
                              entry.id
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="mn-small-empty">
                  No symptoms recorded yet.
                </div>
              )}

              {symptomInsights.severeCount > 0 && (
                <div className="mn-safety-note">
                  <strong>Wellness note:</strong>
                  <br />
                  You have recorded severe symptoms.
                  If symptoms are severe, unusual or
                  persistent, consider speaking with a
                  qualified healthcare professional.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}

        <div className="mn-disclaimer">
          <span>ⓘ</span>

          <p>
            Menstrual Wellness provides general
            educational and wellness information. It does
            not diagnose medical conditions. If symptoms
            are severe, unusual or persistent, consider
            speaking with a qualified healthcare
            professional.
          </p>
        </div>
        
        <div className="mn-back-dashboard">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

      </main>
    </div>
  );
}

export default MenstrualWellness;