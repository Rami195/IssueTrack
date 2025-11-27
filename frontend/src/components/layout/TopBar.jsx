// src/components/layout/TopBar.jsx
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import useAppStore from "../../store/useAppStore";

export default function TopBar({ userName }) {
  const { searchQuery, setSearchQuery } = useAppStore();

  return (
    <Box
      sx={{
        height: 72,
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
      }}
    >
      <TextField
        size="small"
        placeholder="Search tickets, users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          maxWidth: 420,
          "& .MuiOutlinedInput-root": {
            borderRadius: 999,
            bgcolor: "#020617",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "grey.500" }} />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {userName || "Admin User"}
          </Typography>
          <Typography variant="caption" sx={{ color: "grey.400" }}>
            Administrator
          </Typography>
        </Box>
        <IconButton>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {userName?.[0] || "A"}
          </Avatar>
        </IconButton>
      </Box>
    </Box>
  );
}
