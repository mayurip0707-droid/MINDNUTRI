import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

/*
============================================================
MINDNUTRI — WELLNESS SCORE CHART
Local Wellness Analytics
No External API
============================================================
*/

function getScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round(
    Math.min(Math.max(number, 0), 100)
  );
}

function getStatus(score) {
  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 60) {
    return "Good";
  }

  if (score >= 40) {
    return "Needs Attention";
  }

  return "Needs Improvement";
}

function WellnessScoreChart({
  moodScore = 0,
  stressScore = 0,
  sleepScore = 0,
  nutritionScore = 0,
  hydrationScore = 0,
}) {
  const mood = getScore(moodScore);
  const stress = getScore(stressScore);
  const sleep = getScore(sleepScore);
  const nutrition = getScore(nutritionScore);
  const hydration = getScore(hydrationScore);

  /*
   * Overall wellness score
   *
   * Equal weighting is used so that every wellness
   * dimension contributes to the overall score.
   */
  const overallScore = Math.round(
    (mood +
      stress +
      sleep +
      nutrition +
      hydration) /
      5
  );

  const chartData = [
    {
      name: "Wellness Score",
      value: overallScore,
      fill: "#00a878",
    },
  ];

  return (
    <div className="wellness-score-chart">

      {/* HEADER */}

      <div className="wellness-chart-header">

        <div>
          <span className="wellness-chart-eyebrow">
            OVERALL WELLNESS
          </span>

          <h3>
            Your Wellness Score
          </h3>

          <p>
            A combined view of your current
            wellness indicators.
          </p>
        </div>

        <div className="wellness-chart-icon">
          ✨
        </div>

      </div>

      {/* SCORE */}

      <div className="wellness-score-main">

        <div
          className="wellness-score-radial"
          style={{
            width: "280px",
            height: "280px",
            position: "relative",
          }}
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              barSize={18}
              data={chartData}
            >

              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                tick={false}
              />

              <RadialBar
                dataKey="value"
                cornerRadius={12}
                background
              />

            </RadialBarChart>
          </ResponsiveContainer>

          <div className="wellness-score-center">

            <span>
              SCORE
            </span>

            <strong>
              {overallScore}
            </strong>

            <small>
              / 100
            </small>

          </div>

        </div>

        {/* STATUS */}

        <div className="wellness-score-status">

          <span>
            CURRENT STATUS
          </span>

          <strong>
            {getStatus(overallScore)}
          </strong>

          <p>
            {overallScore >= 80
              ? "Your wellness indicators are looking strong. Keep maintaining your healthy routines."
              : overallScore >= 60
              ? "Your wellness is moving in a positive direction. Continue building consistent habits."
              : overallScore >= 40
              ? "Some wellness areas may need more attention. Focus on small, consistent improvements."
              : "Your current data suggests that several wellness areas could benefit from positive lifestyle changes."}
          </p>

        </div>

      </div>

      {/* INDIVIDUAL SCORES */}

      <div className="wellness-score-grid">

        {/* MOOD */}

        <div className="wellness-score-item">

          <div className="wellness-score-item-top">

            <span>
              😊
            </span>

            <div>
              <small>
                MOOD
              </small>

              <strong>
                {mood}/100
              </strong>
            </div>

          </div>

          <div className="wellness-score-progress">

            <div
              style={{
                width: `${mood}%`,
              }}
            />

          </div>

        </div>

        {/* STRESS */}

        <div className="wellness-score-item">

          <div className="wellness-score-item-top">

            <span>
              🧠
            </span>

            <div>
              <small>
                STRESS
              </small>

              <strong>
                {stress}/100
              </strong>
            </div>

          </div>

          <div className="wellness-score-progress">

            <div
              style={{
                width: `${stress}%`,
              }}
            />

          </div>

        </div>

        {/* SLEEP */}

        <div className="wellness-score-item">

          <div className="wellness-score-item-top">

            <span>
              🌙
            </span>

            <div>
              <small>
                SLEEP
              </small>

              <strong>
                {sleep}/100
              </strong>
            </div>

          </div>

          <div className="wellness-score-progress">

            <div
              style={{
                width: `${sleep}%`,
              }}
            />

          </div>

        </div>

        {/* NUTRITION */}

        <div className="wellness-score-item">

          <div className="wellness-score-item-top">

            <span>
              🥗
            </span>

            <div>
              <small>
                NUTRITION
              </small>

              <strong>
                {nutrition}/100
              </strong>
            </div>

          </div>

          <div className="wellness-score-progress">

            <div
              style={{
                width: `${nutrition}%`,
              }}
            />

          </div>

        </div>

        {/* HYDRATION */}

        <div className="wellness-score-item">

          <div className="wellness-score-item-top">

            <span>
              💧
            </span>

            <div>
              <small>
                HYDRATION
              </small>

              <strong>
                {hydration}/100
              </strong>
            </div>

          </div>

          <div className="wellness-score-progress">

            <div
              style={{
                width: `${hydration}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* DISCLAIMER */}

      <div className="wellness-score-note">

        <span>
          ⓘ
        </span>

        <p>
          This score is a wellness summary based
          on the information you record. It is not
          a medical or clinical assessment.
        </p>

      </div>

    </div>
  );
}

export default WellnessScoreChart;