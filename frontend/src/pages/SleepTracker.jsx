import React, { useEffect, useState } from "react";
import "./SleepTracker.css";

const SleepTracker = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [sleepTime, setSleepTime] = useState("");
  const [sleepPeriod, setSleepPeriod] = useState("AM");

  const [wakeTime, setWakeTime] = useState("");
  const [wakePeriod, setWakePeriod] = useState("AM");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [sleepHistory, setSleepHistory] = useState([]);

  // ============================================================
  // LOCAL STORAGE KEYS
  // ============================================================

  const SLEEP_HISTORY_KEY = "mindnutri_sleep_history";
  const SLEEP_LATEST_KEY = "mindnutri_sleep_data";

  // ============================================================
  // LOAD SLEEP HISTORY
  // ============================================================

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(
        SLEEP_HISTORY_KEY
      );

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
          setSleepHistory(parsedHistory);
        }
      }
    } catch (error) {
      console.error(
        "Unable to load sleep history:",
        error
      );
    }
  }, []);

  // ============================================================
  // CALCULATE SLEEP DURATION
  // ============================================================
  
  const convertTo24Hour = (time, period) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":").map(Number);

    let hour = hours % 12;

    if (period === "PM") {
      hour += 12;
    }

    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const calculateDuration = () => {
    if (!sleepTime || !wakeTime) {
      return 0;
    }

    const sleep24 = convertTo24Hour(sleepTime, sleepPeriod);
    const wake24 = convertTo24Hour(wakeTime, wakePeriod);

    const sleep = new Date(`2000-01-01T${sleep24}`);
    let wake = new Date(`2000-01-01T${wake24}`);

    if (wake <= sleep) {
      wake.setDate(wake.getDate() + 1);
    }

    return ((wake - sleep) / (1000 * 60 * 60)).toFixed(1);
  };

  const duration = calculateDuration();

  // ============================================================
  // 7-DAY SLEEP TREND DATA
  // ============================================================
  // Newest record is stored first.
  // Therefore slice(0, 7) gives the latest 7 records.
  // ============================================================

  const last7SleepRecords =
    sleepHistory.slice(0, 7);

  // ============================================================
  // AVERAGE SLEEP
  // ============================================================

  const averageSleep =
    last7SleepRecords.length > 0
      ? (
          last7SleepRecords.reduce(
            (total, record) =>
              total +
              Number(record.duration || 0),
            0
          ) /
          last7SleepRecords.length
        ).toFixed(1)
      : 0;

  // ============================================================
  // AVERAGE QUALITY
  // ============================================================

  const averageQuality =
    last7SleepRecords.length > 0
      ? (
          last7SleepRecords.reduce(
            (total, record) =>
              total +
              Number(record.quality || 0),
            0
          ) /
          last7SleepRecords.length
        ).toFixed(1)
      : 0;

  // ============================================================
  // BEST SLEEP
  // ============================================================

  const bestSleep =
    last7SleepRecords.length > 0
      ? Math.max(
          ...last7SleepRecords.map(
            (record) =>
              Number(record.duration || 0)
          )
        ).toFixed(1)
      : 0;

  // ============================================================
  // LOWEST SLEEP
  // ============================================================

  const lowestSleep =
    last7SleepRecords.length > 0
      ? Math.min(
          ...last7SleepRecords.map(
            (record) =>
              Number(record.duration || 0)
          )
        ).toFixed(1)
      : 0;

  // ============================================================
  // STEP 11.1 — SLEEP PATTERN ANALYSIS
  // ============================================================

  // Average sleep duration as number
  const averageSleepNumber =
    last7SleepRecords.length > 0
      ? last7SleepRecords.reduce(
          (total, record) =>
            total +
            Number(record.duration || 0),
          0
        ) /
        last7SleepRecords.length
      : 0;

  // Average sleep quality as number
  const averageQualityNumber =
    last7SleepRecords.length > 0
      ? last7SleepRecords.reduce(
          (total, record) =>
            total +
            Number(record.quality || 0),
          0
        ) /
        last7SleepRecords.length
      : 0;

  // Count days with less than 7 hours
  const lowSleepDays =
    last7SleepRecords.filter(
      (record) =>
        Number(record.duration || 0) < 7
    ).length;

  // Count days with recommended sleep
  const healthySleepDays =
    last7SleepRecords.filter(
      (record) => {
        const hours = Number(
          record.duration || 0
        );

        return (
          hours >= 7 &&
          hours <= 9
        );
      }
    ).length;

  // Sleep duration values
  const sleepDurations =
    last7SleepRecords.map(
      (record) =>
        Number(record.duration || 0)
    );

  // Calculate sleep variability
  const sleepVariability =
    sleepDurations.length > 1
      ? Math.max(...sleepDurations) -
        Math.min(...sleepDurations)
      : 0;

  // Check whether sleep is consistent
  const isSleepConsistent =
    sleepVariability <= 1.5;

  // Check whether average sleep is below target
  const hasLowAverageSleep =
    averageSleepNumber > 0 &&
    averageSleepNumber < 7;

  // Check whether average quality is good
  const hasGoodSleepQuality =
    averageQualityNumber >= 4;

  // Check whether low-sleep days are frequent
  const hasFrequentLowSleep =
    last7SleepRecords.length >= 3 &&
    lowSleepDays >=
      Math.ceil(
        last7SleepRecords.length / 2
      );

  // ============================================================
  // STEP 11.2 — PERSONALIZED SLEEP INSIGHTS
  // ============================================================

  const getPersonalizedSleepInsight = () => {

    // ----------------------------------------------------------
    // Not enough data
    // ----------------------------------------------------------

    if (last7SleepRecords.length < 3) {
      return {
        type: "info",
        icon: "📊",
        title: "Keep tracking your sleep",
        message:
          "Save at least 3 sleep records to get a more personalized sleep pattern insight.",
        action:
          "Continue logging your sleep time, wake time and sleep quality.",
      };
    }

    // ----------------------------------------------------------
    // Average sleep is low + frequent low-sleep days
    // ----------------------------------------------------------

    if (
      hasLowAverageSleep &&
      hasFrequentLowSleep
    ) {
      return {
        type: "warning",
        icon: "🌙",
        title:
          "Your sleep duration needs attention",
        message:
          `Your average sleep is ${averageSleep} hours, and you had ${lowSleepDays} low-sleep days recently.`,
        action:
          "Try moving your bedtime slightly earlier and maintain a consistent sleep schedule.",
      };
    }

    // ----------------------------------------------------------
    // Average sleep is low
    // ----------------------------------------------------------

    if (hasLowAverageSleep) {
      return {
        type: "warning",
        icon: "⏰",
        title: "You may need more sleep",
        message:
          `Your recent average sleep is ${averageSleep} hours, which is below the 7-hour target used by this wellness tracker.`,
        action:
          "Try adding 30–60 minutes to your sleep opportunity and keep your bedtime consistent.",
      };
    }

    // ----------------------------------------------------------
    // Sleep quality is poor
    // ----------------------------------------------------------

    if (averageQualityNumber < 3) {
      return {
        type: "warning",
        icon: "😴",
        title:
          "Your sleep quality could improve",
        message:
          `Your average sleep quality is ${averageQuality}/5.`,
        action:
          "Try a relaxing bedtime routine and reduce screen use close to bedtime.",
      };
    }

    // ----------------------------------------------------------
    // Sleep duration is inconsistent
    // ----------------------------------------------------------

    if (!isSleepConsistent) {
      return {
        type: "info",
        icon: "📈",
        title:
          "Your sleep pattern is inconsistent",
        message:
          `Your sleep duration varies by ${sleepVariability.toFixed(1)} hours across your recent records.`,
        action:
          "Try keeping your bedtime and wake-up time closer to the same schedule each day.",
      };
    }

    // ----------------------------------------------------------
    // Good sleep duration + good quality
    // ----------------------------------------------------------

    if (
      averageSleepNumber >= 7 &&
      averageSleepNumber <= 9 &&
      hasGoodSleepQuality
    ) {
      return {
        type: "success",
        icon: "✨",
        title:
          "Your sleep pattern looks healthy",
        message:
          `Your average sleep is ${averageSleep} hours with an average quality of ${averageQuality}/5.`,
        action:
          "Keep following the sleep routine that is working well for you.",
      };
    }

    // ----------------------------------------------------------
    // Good duration but quality needs attention
    // ----------------------------------------------------------

    if (
      averageSleepNumber >= 7 &&
      averageSleepNumber <= 9
    ) {
      return {
        type: "info",
        icon: "🌿",
        title:
          "Your sleep duration is on track",
        message:
          `You are averaging ${averageSleep} hours of sleep, but your average quality is ${averageQuality}/5.`,
        action:
          "Focus on making your bedtime routine more relaxing and consistent.",
      };
    }

    // ----------------------------------------------------------
    // Fallback
    // ----------------------------------------------------------

    return {
      type: "info",
      icon: "💡",
      title:
        "Keep building your sleep pattern",
      message:
        "Your sleep records show a mixed pattern.",
      action:
        "Continue tracking your sleep so MindNutri can provide more personalized insights.",
    };
  };

  const personalizedSleepInsight =
    getPersonalizedSleepInsight();

  // ============================================================
  // SLEEP STATUS
  // ============================================================

  const getSleepStatus = () => {

    if (!duration) {
      return "Enter your sleep and wake time";
    }

    if (duration < 6) {
      return "Your sleep duration is low";
    }

    if (duration < 7) {
      return "Try to get a little more sleep";
    }

    if (duration <= 9) {
      return "Good sleep duration";
    }

    return "You may be sleeping longer than recommended";
  };

  // ============================================================
  // SLEEP SCORE
  // ============================================================

  const getScore = () => {

    if (!duration) {
      return 0;
    }

    let score = 0;

    if (
      duration >= 7 &&
      duration <= 9
    ) {
      score += 60;
    } else if (duration >= 6) {
      score += 40;
    } else {
      score += 20;
    }

    score += quality * 8;

    return Math.min(score, 100);
  };

  // ============================================================
  // SAVE SLEEP RECORD
  // ============================================================

  const saveSleep = () => {

    console.log("SAVE SLEEP CLICKED");

    if (!sleepTime || !wakeTime) {
      return;
    }

    const sleepData = {
      id: Date.now(),

      date: new Date()
        .toISOString()
        .split("T")[0],

      sleepTime: convertTo24Hour(sleepTime, sleepPeriod),
      wakeTime: convertTo24Hour(wakeTime, wakePeriod),
      duration: Number(duration),
      quality,
      notes,
      score: getScore(),
    };

    // ----------------------------------------------------------
    // Add new record to beginning
    // Newest record first
    // ----------------------------------------------------------

    const updatedHistory = [
      sleepData,
      ...sleepHistory,
    ];

    // ----------------------------------------------------------
    // Update React state
    // ----------------------------------------------------------

    setSleepHistory(
      updatedHistory
    );

    // ----------------------------------------------------------
    // Save complete history
    // ----------------------------------------------------------

    localStorage.setItem(
      SLEEP_HISTORY_KEY,
      JSON.stringify(
        updatedHistory
      )
    );

    // ----------------------------------------------------------
    // Save latest record separately
    // Dashboard can use this
    // ----------------------------------------------------------

    localStorage.setItem(
      SLEEP_LATEST_KEY,
      JSON.stringify(
        sleepData
      )
    );

    // ----------------------------------------------------------
    // Success message
    // ----------------------------------------------------------

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sleep-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sleep-header">

        <div>

          <p className="small-label">
            WELLNESS TRACKER
          </p>

          <h1>
            Sleep Tracker
          </h1>

          <p className="sleep-subtitle">
            Understand your sleep patterns and
            build healthier sleep habits.
          </p>

        </div>

        
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
       
        <button
          type="button"
          className="back-dashboard-btn"
          onClick={() => window.location.href = "/dashboard"}
        >
          <span className="back-arrow">←</span>
          Back to Dashboard
        </button>


        <div className="sleep-icon">
          🌙
        </div>

      </div>

      </div>

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="sleep-grid">

        {/* ====================================================
            SLEEP INPUT CARD
        ==================================================== */}

        <div className="sleep-card">

          <div className="card-title">

            <span>
              🌙
            </span>

            <div>

              <h2>
                Log Your Sleep
              </h2>

              <p>
                Tell us about your last night's sleep
              </p>

            </div>

          </div>

          {/* TIME INPUTS */}

          <div className="time-grid">
           
            <div className="input-group">
              <label>Sleep Time</label>

              <div className="time-input-row">
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />

                <select
                  value={sleepPeriod}
                  onChange={(e) => setSleepPeriod(e.target.value)}
                  aria-label="Sleep AM or PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Wake Up Time</label>

              <div className="time-input-row">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />

                <select
                  value={wakePeriod}
                  onChange={(e) => setWakePeriod(e.target.value)}
                  aria-label="Wake up AM or PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

          </div>

          {/* ==================================================
              DURATION
          ================================================== */}

          <div className="duration-box">

            <span className="duration-icon">
              ⏰
            </span>

            <div>

              <span className="duration-label">
                SLEEP DURATION
              </span>

              <strong>
                {duration
                  ? `${duration} hours`
                  : "--"}
              </strong>

            </div>

          </div>

          {/* ==================================================
              QUALITY
          ================================================== */}

          <div className="quality-section">

            <div className="quality-heading">

              <label>
                How was your sleep quality?
              </label>

              <span>
                {quality}/5
              </span>

            </div>

            <div className="quality-buttons">

              {[1, 2, 3, 4, 5].map(
                (value) => (

                  <button
                    key={value}
                    type="button"
                    className={
                      quality === value
                        ? "quality-btn active"
                        : "quality-btn"
                    }
                    onClick={() =>
                      setQuality(value)
                    }
                  >

                    {value === 1 && "😴"}
                    {value === 2 && "😕"}
                    {value === 3 && "😐"}
                    {value === 4 && "🙂"}
                    {value === 5 && "😄"}

                    <small>
                      {value}
                    </small>

                  </button>

                )
              )}

            </div>

          </div>

          {/* ==================================================
              NOTES
          ================================================== */}

          <div className="input-group">

            <label>
              Sleep Notes
            </label>

            <textarea
              placeholder="How did you feel after waking up?"
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
            />

          </div>

          {/* ==================================================
              SAVE BUTTON
          ================================================== */}

          <button
            type="button"
            className="save-sleep-btn"
            onClick={saveSleep}
            disabled={
              !sleepTime ||
              !wakeTime
            }
          >
            💾 Save Sleep Record
          </button>

          {/* SUCCESS MESSAGE */}

          {saved && (
            <div className="success-message">
              ✓ Sleep record saved successfully
            </div>
          )}

        </div>

        {/* ====================================================
            SCORE CARD
        ==================================================== */}

        <div className="sleep-card score-card">

          <div className="card-title">

            <span>
              ✨
            </span>

            <div>

              <h2>
                Sleep Wellness Score
              </h2>

              <p>
                Based on your duration and sleep quality
              </p>

            </div>

          </div>

          {/* SCORE CIRCLE */}

          <div className="score-circle">

            <div>

              <strong>
                {getScore()}
              </strong>

              <span>
                /100
              </span>

            </div>

          </div>

          <h3>
            {getSleepStatus()}
          </h3>

          <p className="score-description">
            A consistent sleep schedule can support
            your mental wellbeing, energy and daily
            performance.
          </p>

        </div>

      </div>

      {/* ======================================================
          GENERAL SLEEP INSIGHTS
      ====================================================== */}

      <div className="sleep-card">

        <div className="card-title">

          <span>
            💡
          </span>

          <div>

            <h2>
              Sleep Insights
            </h2>

            <p>
              Simple recommendations for better rest
            </p>

          </div>

        </div>

        <div className="insight-grid">

          {/* INSIGHT 1 */}

          <div className="insight-item">

            <span>
              🕐
            </span>

            <div>

              <strong>
                Keep a consistent schedule
              </strong>

              <p>
                Try going to bed and waking up
                around the same time each day.
              </p>

            </div>

          </div>

          {/* INSIGHT 2 */}

          <div className="insight-item">

            <span>
              📱
            </span>

            <div>

              <strong>
                Reduce screen time
              </strong>

              <p>
                Avoid excessive screen use close
                to bedtime.
              </p>

            </div>

          </div>

          {/* INSIGHT 3 */}

          <div className="insight-item">

            <span>
              ☕
            </span>

            <div>

              <strong>
                Watch caffeine timing
              </strong>

              <p>
                Avoid consuming too much caffeine
                late in the day.
              </p>

            </div>

          </div>

          {/* INSIGHT 4 */}

          <div className="insight-item">

            <span>
              🧘
            </span>

            <div>

              <strong>
                Create a relaxing routine
              </strong>

              <p>
                Gentle breathing or relaxation
                before bed may help prepare you
                for sleep.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          7 DAY SLEEP HISTORY
      ====================================================== */}

      <div className="sleep-card sleep-history-card">

        <div className="card-title">

          <span>
            📅
          </span>

          <div>

            <h2>
              7-Day Sleep History
            </h2>

            <p>
              Review your recent sleep records.
            </p>

          </div>

        </div>

        {/* EMPTY HISTORY */}

        {sleepHistory.length === 0 ? (

          <div className="empty-sleep-history">

            <span>
              🌙
            </span>

            <p>
              No sleep records yet.
            </p>

            <small>
              Save your sleep record to start
              tracking your weekly pattern.
            </small>

          </div>

        ) : (

          <div className="sleep-history-list">

            {sleepHistory
              .slice(0, 7)
              .map(
                (record, index) => (

                  <div
                    className="history-row"
                    key={`${
                      record.id ||
                      record.date
                    }-${index}`}
                  >

                    {/* DATE */}

                    <div className="history-date">

                      <strong>
                        {record.date}
                      </strong>

                      <span>
                        {record.sleepTime}
                        {" → "}
                        {record.wakeTime}
                      </span>

                    </div>

                    {/* DURATION */}

                    <div className="history-duration">

                      <span>
                        Duration
                      </span>

                      <strong>
                        {record.duration} hrs
                      </strong>

                    </div>

                    {/* QUALITY */}

                    <div className="history-quality">

                      <span>
                        Quality
                      </span>

                      <strong>
                        {record.quality}/5
                      </strong>

                    </div>

                    {/* SCORE */}

                    <div className="history-score">

                      <span>
                        Score
                      </span>

                      <strong>
                        {record.score}/100
                      </strong>

                    </div>

                  </div>

                )
              )}

          </div>

        )}

      </div>

      {/* ======================================================
          7 DAY SLEEP TREND
      ====================================================== */}

      <div className="sleep-card sleep-trend-card">

        <div className="card-title">

          <span>
            📈
          </span>

          <div>

            <h2>
              7-Day Sleep Trend
            </h2>

            <p>
              Understand your recent sleep pattern.
            </p>

          </div>

        </div>

        {/* EMPTY TREND */}

        {last7SleepRecords.length === 0 ? (

          <div className="empty-sleep-history">

            <span>
              📊
            </span>

            <p>
              Your sleep trend will appear here.
            </p>

            <small>
              Save sleep records to build your
              7-day trend.
            </small>

          </div>

        ) : (

          <>

            {/* ==================================================
                TREND SUMMARY
            ================================================== */}

            <div className="sleep-trend-summary">

              {/* AVERAGE SLEEP */}

              <div className="trend-stat">

                <span>
                  ⏱️
                </span>

                <div>

                  <small>
                    Average Sleep
                  </small>

                  <strong>
                    {averageSleep} hrs
                  </strong>

                </div>

              </div>

              {/* AVERAGE QUALITY */}

              <div className="trend-stat">

                <span>
                  ⭐
                </span>

                <div>

                  <small>
                    Average Quality
                  </small>

                  <strong>
                    {averageQuality}/5
                  </strong>

                </div>

              </div>

              {/* BEST SLEEP */}

              <div className="trend-stat">

                <span>
                  🏆
                </span>

                <div>

                  <small>
                    Best Sleep
                  </small>

                  <strong>
                    {bestSleep} hrs
                  </strong>

                </div>

              </div>

              {/* LOWEST SLEEP */}

              <div className="trend-stat">

                <span>
                  ⚠️
                </span>

                <div>

                  <small>
                    Lowest Sleep
                  </small>

                  <strong>
                    {lowestSleep} hrs
                  </strong>

                </div>

              </div>

            </div>

            {/* ==================================================
                DAILY TREND
            ================================================== */}

            <div className="sleep-trend-list">

              {last7SleepRecords
                .slice()
                .reverse()
                .map(
                  (record, index) => {

                    const sleepHours =
                      Number(
                        record.duration ||
                        0
                      );

                    const percentage =
                      Math.min(
                        (sleepHours / 10) *
                          100,
                        100
                      );

                    return (

                      <div
                        className="trend-row"
                        key={`${
                          record.id ||
                          record.date
                        }-${index}`}
                      >

                        {/* DATE */}

                        <div className="trend-date">

                          <strong>
                            {record.date}
                          </strong>

                          <small>
                            Quality{" "}
                            {record.quality}/5
                          </small>

                        </div>

                        {/* BAR */}

                        <div className="trend-bar-container">

                          <div
                            className="trend-bar"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                        {/* HOURS */}

                        <strong className="trend-hours">
                          {sleepHours} hrs
                        </strong>

                      </div>

                    );

                  }
                )}

            </div>

            {/* ==================================================
                TREND NOTE
            ================================================== */}

            <div className="trend-note">

              💡 A regular sleep schedule can help
              support your daily energy and overall
              wellness.

            </div>

          </>

        )}

      </div>

      {/* ======================================================
          STEP 11.3 — PERSONALIZED SLEEP INSIGHT
      ====================================================== */}

      <div
        className={`sleep-card personalized-insight-card ${personalizedSleepInsight.type}`}
      >

        {/* INSIGHT HEADER */}

        <div className="card-title">

          <span>
            🧠
          </span>

          <div>

            <h2>
              Your Personalized Sleep Insight
            </h2>

            <p>
              Based on your recent sleep pattern.
            </p>

          </div>

        </div>

        {/* INSIGHT CONTENT */}

        <div className="personalized-insight-content">

          <div className="personalized-insight-icon">
            {personalizedSleepInsight.icon}
          </div>

          <div className="personalized-insight-text">

            <h3>
              {personalizedSleepInsight.title}
            </h3>

            <p>
              {personalizedSleepInsight.message}
            </p>

            <div className="sleep-action">

              <strong>
                🎯 Suggested Action
              </strong>

              <span>
                {personalizedSleepInsight.action}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          DISCLAIMER
      ====================================================== */}

      <div className="sleep-disclaimer">

        <span>
          ℹ️
        </span>

        <p>
          Sleep insights are general wellness
          information and are not medical advice
          or diagnosis.
        </p>

      </div>

    </div>
  );
};

export default SleepTracker;