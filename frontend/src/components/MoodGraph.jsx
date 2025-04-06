import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";
import { format } from "date-fns";

const MoodGraph = ({ entries }) => {
  const sortedEntries = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

  const data = sortedEntries.map((entry) => ({
    date: format(new Date(entry.date), "MMM dd"),
    score: entry.moodScore,
  }));

  const getMoodColor = (score) => {
    if (score >= 8) return "#4CAF50"; // Green for happy
    if (score >= 6) return "#8BC34A"; // Light green for good
    if (score >= 4) return "#FFC107"; // Yellow for neutral
    if (score >= 2) return "#FF9800"; // Orange for sad
    return "#F44336"; // Red for very sad
  };

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Mood Trends
      </Typography>
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`${value}/10`, "Mood Score"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8884d8"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={getMoodColor(payload.score)}
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default MoodGraph;
