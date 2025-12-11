// src/views/DashboardView.jsx
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Divider, Table, TableHead, TableBody, TableRow, TablePagination, TableCell, Chip, } from "@mui/material";
import useAppStore from "../store/useAppStore";
import { useState } from "react";
export default function DashboardView() {
  const {
    userName,
    projects,
    tickets,
    loading,
    error,
    searchQuery,
    setView,
    totalProjects
  } = useAppStore();
  const [projectsPage, setProjectsPage] = useState(0);
  const [ticketsPage, setTicketsPage] = useState(0);
  const rowsPerPage = 5;
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

        {/* Proyectos */}
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography sx={{ color: "grey.400", mb: 1, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>Proyectos</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>{totalProjects}</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("projects")}>Ver proyectos</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Tickets */}
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography sx={{ color: "grey.400", mb: 1, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>Tickets</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>{totalTickets}</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>Ver tickets</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Tickets abiertos */}
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography sx={{ color: "grey.400", mb: 1, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>Tickets abiertos</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>{openTickets}</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>Ver tickets</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Tickets cerrados */}
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography sx={{ color: "grey.400", mb: 1, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>Tickets cerrados</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>{closedTickets}</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setView("tickets")}>Ver tickets</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Tickets pendientes */}
        <Grid item size={1}>
          <Card sx={{ borderRadius: 3, bgcolor: "#020617", border: "1px solid rgba(148,163,184,0.3)", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4, px: 3 }}>
              <Typography sx={{ color: "grey.400", mb: 1, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>
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

      <Grid
        container
        spacing={2}
        justifyContent="space-between"
        columns={{ xs: 1, lg: 2 }}
      >
        <Grid item size={1}>
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
                    <TableCell sx={{ color: "grey.400", width: "50%" }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>Nombre</Box>
                    </TableCell>
                    <TableCell sx={{ color: "grey.400", width: "50%" }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>Creado</Box>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredProjects
                    .slice(projectsPage * rowsPerPage, projectsPage * rowsPerPage + rowsPerPage)
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ width: "50%" }}>
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            {p.name}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: "50%" }}>
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            {p.created_at && new Date(p.created_at).toLocaleDateString()}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" sx={{ color: "grey.400", textAlign: "center" }}>
                          No se encontraron proyectos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={filteredProjects.length}
                page={projectsPage}
                onPageChange={(_, newPage) => setProjectsPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
              />

              {loading && (
                <Typography variant="caption" sx={{ mt: 1, display: "block", color: "grey.500" }}>
                  Cargando proyectos...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>


        <Grid item size={1}>
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
                    <TableCell
                      sx={{ color: "grey.400", width: "50%" }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        Título
                      </Box>
                    </TableCell>

                    <TableCell
                      sx={{ color: "grey.400", width: "50%" }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        Estado
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredTickets
                    .slice(ticketsPage * rowsPerPage, ticketsPage * rowsPerPage + rowsPerPage)
                    .map((t) => {
                      const status = (t.status || "").toLowerCase();

                      const statusLabel =
                        status === "open"
                          ? "Abierto"
                          : status === "pending"
                            ? "Pendiente"
                            : status === "closed"
                              ? "Cerrado"
                              : t.status || "N/A";

                      return (
                        <TableRow key={t.id}>
                          {/* Columna Título */}
                          <TableCell sx={{ width: "50%" }}>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                              {t.title}
                            </Box>
                          </TableCell>

                          {/* Columna Estado */}
                          <TableCell sx={{ width: "50%" }}>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                              <Chip
                                size="small"
                                label={statusLabel}
                                variant="outlined"
                                sx={{
                                  textTransform: "none",
                                  borderColor:
                                    status === "open"
                                      ? "rgba(34,197,94,0.7)"
                                      : status === "pending"
                                        ? "rgba(234,179,8,0.8)"
                                        : "rgba(248,113,113,0.8)",
                                  bgcolor:
                                    status === "open"
                                      ? "rgba(22,163,74,0.15)"
                                      : status === "pending"
                                        ? "rgba(202,138,4,0.18)"
                                        : "rgba(239,68,68,0.16)",
                                  color:
                                    status === "open"
                                      ? "#4ade80"
                                      : status === "pending"
                                        ? "#facc15"
                                        : "#fca5a5",
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" sx={{ color: "grey.400", textAlign: "center" }}>
                          No se encontraron tickets.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={filteredTickets.length}
                page={ticketsPage}
                onPageChange={(_, newPage) => setTicketsPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
              />
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
