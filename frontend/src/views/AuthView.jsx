// src/views/AuthView.jsx
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useState } from "react";
import useAppStore from "../store/useAppStore";

export default function AuthView() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
  });

  const { login, register, authLoading, error } = useAppStore();

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({
          username: form.username,
          password: form.password,
        });
      } else {
        await register({
          username: form.username,
          password: form.password,
          full_name: form.full_name || undefined,
          email: form.email || undefined,
        });
      }
    } catch {
      // el error ya se guarda en el store
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderRadius: 3,
          bgcolor: "#020617",
          border: "1px solid rgba(148,163,184,0.4)",
          color: "grey.100",
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 22,
              mx: "auto",
              mb: 1,
            }}
          >
            I
          </Box>
          <Typography variant="h5" fontWeight={700}>
            IssueHub
          </Typography>
          <Typography variant="body2" sx={{ color: "grey.400", mt: 0.5 }}>
            Inicia sesión o crea una cuenta para gestionar tus tickets.
          </Typography>
        </Box>

        <Tabs
          value={mode}
          onChange={(_, val) => setMode(val)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Login" value="login" />
          <Tab label="Registrarse" value="register" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {mode === "register" && (
              <>
                <TextField
                  label="Nombre completo"
                  variant="outlined"
                  size="small"
                  value={form.full_name}
                  onChange={handleChange("full_name")}
                  InputLabelProps={{ shrink: !!form.full_name }}
                />
                <TextField
                  label="Email"
                  variant="outlined"
                  size="small"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  InputLabelProps={{ shrink: !!form.email }}
                />
              </>
            )}

            <TextField
              label="Usuario"
              variant="outlined"
              size="small"
              required
              value={form.username}
              onChange={handleChange("username")}
            />

            <TextField
              label="Contraseña"
              variant="outlined"
              size="small"
              type="password"
              required
              value={form.password}
              onChange={handleChange("password")}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
              disabled={authLoading}
            >
              {mode === "login"
                ? authLoading
                  ? "Ingresando..."
                  : "Ingresar"
                : authLoading
                ? "Creando cuenta..."
                : "Registrarse"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
