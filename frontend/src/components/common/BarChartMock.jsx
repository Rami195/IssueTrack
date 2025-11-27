// src/components/common/BarChartMock.jsx
import { Box, Typography } from "@mui/material";

export default function BarChartMock({ values }) {
  const max = Math.max(...values, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        Sales Over Time (Mock)
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, height: 180 }}>
        {values.map((v, idx) => (
          <Box
            key={idx}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: "60%",
                borderRadius: 999,
                background: "linear-gradient(to top, #1d4ed8, #38bdf8)",
                height: `${(v / max) * 140}px`,
                transition: "height 0.3s ease",
              }}
            />
            <Typography variant="caption" sx={{ color: "grey.400" }}>
              {days[idx]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
