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
import MenuIcon from "@mui/icons-material/Menu";
import useAppStore from "../../store/useAppStore";

export default function TopBar({ userName, onOpenSidebar }) {
  const { searchQuery, setSearchQuery } = useAppStore();

  return (
    <Box
      sx={{
        height: 72,
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, md: 3 },
        gap: 2,
      }}
    >
      {/* Izquierda: botón menú (mobile) + buscador */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
        {/* Botón hamburguesa solo en pantallas chicas */}
        <IconButton
          onClick={onOpenSidebar}
          sx={{
            display: { xs: "inline-flex", md: "none" },
          }}
        >
          <MenuIcon />
        </IconButton>

        <TextField
          size="small"
          placeholder="Buscar tickets, proyectos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{
            maxWidth: { xs: "100%", sm: 420 },
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
      </Box>

      {/* Derecha: usuario */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {userName || "Usuario Admin"}
          </Typography>
          <Typography variant="caption" sx={{ color: "grey.400" }}>
            Administrador
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
