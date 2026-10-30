import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function MentalWellnessChart({
  moodData = [],
  stressScore = null,
}) {
  /*
   * Combine mood history with current stress score.
   * Mood data should contain:
   * {
   *   date: "2026-08-30",
   *   label: "Aug 30",
   *   mood: 75
   * }
   */

  const chartData = Array.isArray(moodData)
    ? [...moodData]
    : [];

  /*
   * Add stress score to the latest available
   * mood data point.
   */
  if (chartData.length > 0 && stressScore !== null) {
    chartData[chartData.length - 1] = {
      ...chartData[chartData.length - 1],
      stress: Number(stressScore),
    };
  }

  /*
   * If there is no mood data but stress data exists,
   * show stress as a single data point.
   */
  if (
    chartData.length === 0 &&
    stressScore !== null
  ) {
    chartData.push({
      date: "Today",
      label: "Today",
      stress: Number(stressScore),
    });
  }

  return (
    <div className="mental-wellness-chart">

      {/* HEADER */}

      <div className="wellness-chart-header">

        <div>
          <span className="wellness-chart-eyebrow">
            MENTAL WELLNESS
          </span>

          <h3>
            Mood & Stress Trend
          </h3>

          <p>
            Track how your emotional wellness
            changes over time.
          </p>
        </div>

        <div className="wellness-chart-icon">
          🧠
        </div>

      </div>

      {/* CHART */}

      {chartData.length >= 1 ? (

        <div
          className="wellness-chart-wrapper"
          style={{
            width: "100%",
            height: 320,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />

              <Tooltip />

              <Legend />

              {/* MOOD */}

              <Line
                type="monotone"
                dataKey="mood"
                name="Mood Score"
                stroke="#00a878"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
                connectNulls
              />

              {/* STRESS */}

              <Line
                type="monotone"
                dataKey="stress"
                name="Stress Score"
                stroke="#e67e22"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
                connectNulls
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

      ) : (

        /* EMPTY STATE */

        <div className="wellness-chart-empty">

          <span className="wellness-empty-icon">
            🧠
          </span>

          <h3>
            No mental wellness data yet
          </h3>

          <p>
            Start recording your mood and complete
            a stress assessment to see your mental
            wellness trends here.
          </p>

        </div>

      )}

    </div>
  );
}

export default MentalWellnessChart;