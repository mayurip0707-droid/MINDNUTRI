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
  ReferenceLine,
} from "recharts";

/*
============================================================
MINDNUTRI — SLEEP WELLNESS CHART
Local Analytics Component
No External API
============================================================
*/

const SLEEP_TARGET = 7;

function SleepWellnessChart({
  sleepData = [],
}) {
  const chartData = Array.isArray(sleepData)
    ? [...sleepData]
        .filter((entry) => entry)
        .map((entry) => ({
          ...entry,
          sleep: Number(entry.sleep ?? entry.duration ?? 0),
          score: Number(entry.score ?? 0),
        }))
        .filter(
          (entry) =>
            Number.isFinite(entry.sleep) ||
            Number.isFinite(entry.score)
        )
        .sort((a, b) =>
          String(a.date || "").localeCompare(
            String(b.date || "")
          )
        )
    : [];

  const averageSleep =
    chartData.length > 0
      ? chartData.reduce(
          (sum, entry) => sum + entry.sleep,
          0
        ) / chartData.length
      : null;

  return (
    <div className="sleep-wellness-chart">

      {/* HEADER */}

      <div className="wellness-chart-header">

        <div>
          <span className="wellness-chart-eyebrow">
            SLEEP WELLNESS
          </span>

          <h3>
            Sleep Pattern
          </h3>

          <p>
            Compare your recorded sleep duration
            with your recommended wellness target.
          </p>
        </div>

        <div className="wellness-chart-icon">
          🌙
        </div>

      </div>

      {/* QUICK STAT */}

      {averageSleep !== null && (
        <div className="sleep-chart-summary">

          <div>
            <span>AVERAGE SLEEP</span>

            <strong>
              {averageSleep.toFixed(1)}h
            </strong>
          </div>

          <div>
            <span>TARGET</span>

            <strong>
              {SLEEP_TARGET}h
            </strong>
          </div>

          <div>
            <span>STATUS</span>

            <strong>
              {averageSleep >= SLEEP_TARGET
                ? "On Target"
                : "Below Target"}
            </strong>
          </div>

        </div>
      )}

      {/* CHART */}

      {chartData.length >= 2 ? (

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
                domain={[0, "auto"]}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Hours",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <Tooltip />

              <Legend />

              {/* TARGET LINE */}

              <ReferenceLine
                y={SLEEP_TARGET}
                stroke="#888"
                strokeDasharray="5 5"
                label={{
                  value: "Target 7h",
                  position: "insideTopRight",
                }}
              />

              {/* SLEEP DURATION */}

              <Line
                type="monotone"
                dataKey="sleep"
                name="Sleep Hours"
                stroke="#557bff"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
                connectNulls
              />

              {/* SLEEP SCORE */}

              {chartData.some(
                (entry) =>
                  Number.isFinite(entry.score) &&
                  entry.score > 0
              ) && (
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Sleep Score"
                  stroke="#8e6ccf"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                  connectNulls
                />
              )}

            </LineChart>
          </ResponsiveContainer>
        </div>

      ) : (

        /* EMPTY STATE */

        <div className="wellness-chart-empty">

          <span className="wellness-empty-icon">
            🌙
          </span>

          <h3>
            Not enough sleep data yet
          </h3>

          <p>
            Add sleep records on at least two
            different days to see your sleep
            pattern here.
          </p>

        </div>

      )}

    </div>
  );
}

export default SleepWellnessChart;