// src/components/common/StatCard.jsx
import { Card, CardContent, Box, Typography } from "@mui/material";

export default function StatCard({ icon, label, value, onClick }) {
  const clickable = Boolean(onClick);

  return (
    <Card
      onClick={onClick}
      sx={{
        bgcolor: "#020617",
        borderRadius: 3,
        border: "1px solid rgba(148,163,184,0.2)",
        height: "100%",
        cursor: clickable ? "pointer" : "default",
        transition: "all 0.15s ease",
        "&:hover": clickable
          ? {
              borderColor: "primary.main",
              bgcolor: "rgba(15,23,42,0.9)",
              transform: "translateY(-1px)",
            }
          : undefined,
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: "rgba(37,99,235,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", color: "grey.400", fontWeight: 500 }}
          >
            {label}
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
