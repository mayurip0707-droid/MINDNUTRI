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

/*
============================================================
MINDNUTRI — NUTRITION PROGRESS CHART
Local Analytics Component
No External API
============================================================
*/

function NutritionProgressChart({
  nutritionData = [],
}) {
  const chartData = Array.isArray(nutritionData)
    ? [...nutritionData]
        .filter((entry) => entry)
        .map((entry) => ({
          ...entry,
          calories: Number(entry.calories || 0),
          protein: Number(entry.protein || 0),
          fiber: Number(entry.fiber || 0),
        }))
        .filter(
          (entry) =>
            Number.isFinite(entry.calories) ||
            Number.isFinite(entry.protein) ||
            Number.isFinite(entry.fiber)
        )
        .sort((a, b) =>
          String(a.date || "").localeCompare(
            String(b.date || "")
          )
        )
    : [];

  return (
    <div className="nutrition-progress-chart">

      {/* HEADER */}

      <div className="wellness-chart-header">

        <div>
          <span className="wellness-chart-eyebrow">
            NUTRITION PROGRESS
          </span>

          <h3>
            Calories & Nutrient Trend
          </h3>

          <p>
            Review your recorded calories,
            protein and fiber over time.
          </p>
        </div>

        <div className="wellness-chart-icon">
          🥗
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
                tick={{ fontSize: 12 }}
              />

              <Tooltip />

              <Legend />

              {/* CALORIES */}

              <Line
                type="monotone"
                dataKey="calories"
                name="Calories"
                stroke="#f39c5a"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
                connectNulls
              />

              {/* PROTEIN */}

              <Line
                type="monotone"
                dataKey="protein"
                name="Protein (g)"
                stroke="#7b61c9"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
                connectNulls
              />

              {/* FIBER */}

              <Line
                type="monotone"
                dataKey="fiber"
                name="Fiber (g)"
                stroke="#3b9b75"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
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
            🥗
          </span>

          <h3>
            Not enough nutrition data yet
          </h3>

          <p>
            Add nutrition entries on at least
            two different days to see your
            nutrition progress.
          </p>

        </div>

      )}

    </div>
  );
}

export default NutritionProgressChart;