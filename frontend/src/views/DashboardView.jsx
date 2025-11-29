// src/views/DashboardView.jsx
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Divider, Table, TableHead, TableBody, TableRow, TableCell, Chip, } from "@mui/material";
import useAppStore from "../store/useAppStore";

export default function DashboardView() {
  const {
    userName,
    projects,
    tickets,
    loading,
    error,
    searchQuery, // lo seguimos usando para filtrar, viene del TopBar
    setView,
  } = useAppStore();

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const q = (searchQuery ?? "").trim().toLowerCase();

  const filteredProjects = q
    ? safeProjects.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    : safeProjects;

  const filteredTickets = q
    ? safeTickets.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    })
    : safeTickets;

  const totalProjects = safeProjects.length;
  const totalTickets = safeTickets.length;
  const openTickets = safeTickets.filter(
    (t) =>
      (t.status || "").toLowerCase() === "open" ||
      (t.status || "").toLowerCase() === "todo"
  ).length;

  const closedTickets = safeTickets.filter(
    (t) => (t.status || "").toLowerCase() === "closed"
  ).length;
  const pendingTickets = safeTickets.filter(
    (t) => (t.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, border: 1, p: 3, borderColor: "rgba(148,163,184,0.2)", borderRadius: 2 }}>
      {/* Header SIN barra de búsqueda propia */}
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "grey.400" }}>
            Bienvenido, {userName || "User"} 👋
          </Typography>
        </Box>
      </Box>

      {error && (
        <Card sx={{ borderRadius: 2, border: "1px solid #b91c1c" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#fecaca" }}>
              {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2} alignItems="stretch" justifyContent="space-between" columns={{ xs: 1, sm: 2, md: 3, lg: 5 }}>
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                Proyectos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                {totalProjects}
              </Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => setView("projects")}>
                Ver proyectos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                Tickets
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                {totalTickets}
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>
                Ver tickets
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                Tickets abiertos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                {openTickets}
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>
                Ver tickets
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                Tickets cerrados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                {closedTickets}
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>
                Ver tickets
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                Tickets pendientes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                {pendingTickets}
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>
                Ver tickets
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* Listados rápidos */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.25)" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Proyectos recientes
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setView("projects")}>
                  Ver todos
                </Button>
              </Box>
              <Divider sx={{ mb: 1.5, borderColor: "rgba(148,163,184,0.3)" }} />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "grey.400" }}>Nombre</TableCell>
                    <TableCell sx={{ color: "grey.400" }}>Creado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.created_at && new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}

                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" sx={{ color: "grey.400" }}>
                          No se encontraron proyectos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {loading && (
                <Typography variant="caption" sx={{ mt: 1, display: "block", color: "grey.500" }}>
                  Cargando proyectos...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.25)" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Tickets recientes
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setView("tickets")}>
                  Ver todos
                </Button>
              </Box>
              <Divider sx={{ mb: 1.5, borderColor: "rgba(148,163,184,0.3)" }} />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "grey.400" }}>Título</TableCell>
                    <TableCell sx={{ color: "grey.400" }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.slice(0, 5).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={t.status || "N/A"}
                          variant="outlined"
                          sx={{ textTransform: "capitalize", borderColor: "rgba(148,163,184,0.4)", color: "grey.200" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" sx={{ color: "grey.400" }}>
                          No se encontraron tickets.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {loading && (
                <Typography variant="caption" sx={{ mt: 1, display: "block", color: "grey.500" }}>
                  Cargando tickets...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
