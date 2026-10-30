import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

/*
============================================================
MINDNUTRI — HYDRATION CHART
Local Analytics Component
No External API
============================================================
*/

const WATER_TARGET = 8;

function HydrationChart({
  hydrationData = [],
  currentWater = 0,
}) {
  const chartData = Array.isArray(hydrationData)
    ? [...hydrationData]
        .filter((entry) => entry)
        .map((entry) => ({
          ...entry,
          water: Number(
            entry.water ??
            entry.glasses ??
            entry.waterIntake ??
            0
          ),
        }))
        .filter((entry) =>
          Number.isFinite(entry.water)
        )
        .sort((a, b) =>
          String(a.date || "").localeCompare(
            String(b.date || "")
          )
        )
    : [];

  /*
   * If there is no history but today's hydration
   * value exists, show today's value.
   */
  if (
    chartData.length === 0 &&
    Number.isFinite(Number(currentWater)) &&
    Number(currentWater) > 0
  ) {
    chartData.push({
      date: "Today",
      label: "Today",
      water: Number(currentWater),
    });
  }

  const averageWater =
    chartData.length > 0
      ? chartData.reduce(
          (sum, entry) => sum + entry.water,
          0
        ) / chartData.length
      : null;

  const todayWater = Number(currentWater) || 0;

  const todayProgress = Math.min(
    (todayWater / WATER_TARGET) * 100,
    100
  );

  return (
    <div className="hydration-chart">

      {/* HEADER */}

      <div className="wellness-chart-header">

        <div>
          <span className="wellness-chart-eyebrow">
            HYDRATION WELLNESS
          </span>

          <h3>
            Water Intake Trend
          </h3>

          <p>
            Track your daily water intake and
            compare it with your hydration target.
          </p>
        </div>

        <div className="wellness-chart-icon">
          💧
        </div>

      </div>

      {/* TODAY'S SUMMARY */}

      <div className="hydration-summary">

        <div className="hydration-summary-main">

          <span>
            TODAY'S WATER
          </span>

          <strong>
            {todayWater}
            <small>
              / {WATER_TARGET} glasses
            </small>
          </strong>

        </div>

        <div className="hydration-summary-progress">

          <div className="hydration-progress-track">

            <div
              className="hydration-progress-fill"
              style={{
                width: `${todayProgress}%`,
              }}
            />

          </div>

          <span>
            {Math.round(todayProgress)}% of target
          </span>

        </div>

      </div>

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
            <AreaChart
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
                domain={[
                  0,
                  Math.max(
                    WATER_TARGET + 2,
                    ...chartData.map(
                      (entry) => entry.water
                    )
                  ),
                ]}
                tick={{ fontSize: 12 }}
              />

              <Tooltip />

              {/* DAILY TARGET */}

              <ReferenceLine
                y={WATER_TARGET}
                stroke="#888"
                strokeDasharray="5 5"
                label={{
                  value: "Target 8",
                  position: "insideTopRight",
                }}
              />

              {/* WATER AREA */}

              <Area
                type="monotone"
                dataKey="water"
                name="Water (glasses)"
                stroke="#3498db"
                fill="#3498db"
                fillOpacity={0.18}
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

      ) : (

        /* EMPTY STATE */

        <div className="wellness-chart-empty">

          <span className="wellness-empty-icon">
            💧
          </span>

          <h3>
            Not enough hydration data yet
          </h3>

          <p>
            Keep recording your daily water
            intake to see your hydration trend.
          </p>

        </div>

      )}

      {/* AVERAGE */}

      {averageWater !== null && (
        <div className="hydration-average">

          <span>
            AVERAGE DAILY INTAKE
          </span>

          <strong>
            {averageWater.toFixed(1)}
            <small>
              glasses
            </small>
          </strong>

          <p>
            {averageWater >= WATER_TARGET
              ? "You are meeting your hydration target."
              : "Try to move closer to your daily hydration target."}
          </p>

        </div>
      )}

    </div>
  );
}

export default HydrationChart;