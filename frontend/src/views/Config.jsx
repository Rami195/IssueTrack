import { Box, Card, CardContent, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import useAppStore from "../store/useAppStore";

export default function Config() {
  const { user, updateUser } = useAppStore();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSubmit = async () => {
    setConfirmOpen(false);

    if (username === user.username && email === user.email && password.trim() === "") {
      setSnackbar({ open: true, message: "No hay cambios para guardar", severity: "warning" });
      return;
    }

    try {
      const payload = {};

      if (username !== user.username) payload.username = username;
      if (email !== user.email) payload.email = email;
      if (password.trim() !== "") payload.password = password;

      await updateUser(payload);

      setSnackbar({ open: true, message: "Datos actualizados correctamente", severity: "success" });
      setPassword("");
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar los datos", severity: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Configuración de cuenta
      </Typography>

      <Card>
        <CardContent>
          <TextField label="Usuario" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} />
          <TextField label="Correo electrónico" fullWidth type="email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Nueva contraseña" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setConfirmOpen(true)}>
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          Confirmar cambios
        </DialogTitle>
        <DialogContent>
          ¿Estás seguro de guardar los cambios en tu cuenta?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
