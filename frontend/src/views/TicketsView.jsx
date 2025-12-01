import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
  TableContainer,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import useAppStore from "../store/useAppStore";

export default function TicketsView() {
  const {
    tickets,
    projects,
    createTicket,
    updateTicket,
    deleteTicket,
    searchQuery,
  } = useAppStore();

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  // creación
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("open");
  const [projectId, setProjectId] = useState("");

  // edición (diálogo)
  const [editOpen, setEditOpen] = useState(false);
  const [editTicketId, setEditTicketId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editStatus, setEditStatus] = useState("open");
  const [editProjectId, setEditProjectId] = useState("");

  // filtro
  const [filterProject, setFilterProject] = useState("all");

  // orden
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // 🔔 Snackbar / Alert MUI
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "success", // "success" | "error" | "warning" | "info"
  });

  const showAlert = (message, severity = "success") => {
    setAlertInfo({ open: true, message, severity });
  };

  const handleCloseAlert = (_, reason) => {
    if (reason === "clickaway") return;
    setAlertInfo((prev) => ({ ...prev, open: false }));
  };

  // 🔥 Diálogo de confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const openDeleteDialog = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;

    if (typeof deleteTicket !== "function") {
      console.error("deleteTicket NO es una función:", deleteTicket);
      showAlert("Error interno: deleteTicket no es una función", "error");
      return;
    }

    try {
      await deleteTicket(ticketToDelete.id);
      showAlert("Ticket eliminado correctamente.", "info");
    } catch (err) {
      console.error("Error al eliminar ticket:", err);
      showAlert(err?.message || "Error al eliminar ticket", "error");
    } finally {
      closeDeleteDialog();
    }
  };

  const projectNameById = useCallback(
    (id) => safeProjects.find((p) => p.id === id)?.name || `#${id}`,
    [safeProjects]
  );

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim() || !projectId) {
      showAlert(
        "Debes ingresar un título y seleccionar un proyecto.",
        "warning"
      );
      return;
    }

    if (typeof createTicket !== "function") {
      console.error("createTicket NO es una función:", createTicket);
      showAlert("Error interno: createTicket no es una función", "error");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      project_id: Number(projectId),
    };

    try {
      await createTicket(payload);
      showAlert("Ticket creado correctamente.", "success");

      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("open");
      setProjectId("");
    } catch (err) {
      console.error("Error al crear ticket:", err);
      showAlert(err?.message || "Error al crear ticket", "error");
    }
  };

  const handleOpenEdit = (ticket) => {
    setEditTicketId(ticket.id);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description || "");
    setEditPriority(ticket.priority || "medium");
    setEditStatus(ticket.status || "open");
    setEditProjectId(ticket.project_id.toString());
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditTicketId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("medium");
    setEditStatus("open");
    setEditProjectId("");
  };

  const handleSaveEdit = async () => {
    if (!editTicketId || !editTitle.trim() || !editProjectId) {
      showAlert(
        "El título y el proyecto son obligatorios para editar el ticket.",
        "warning"
      );
      return;
    }

    if (typeof updateTicket !== "function") {
      console.error("updateTicket NO es una función:", updateTicket);
      showAlert("Error interno: updateTicket no es una función", "error");
      return;
    }

    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      status: editStatus,
      project_id: Number(editProjectId),
    };

    try {
      await updateTicket(editTicketId, payload);
      showAlert("Ticket actualizado correctamente.", "success");
      handleCloseEdit();
    } catch (err) {
      console.error("Error al actualizar ticket:", err);
      showAlert(err?.message || "Error al actualizar ticket", "error");
    }
  };

  const handleSortColumn = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const displayTickets = useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();

    const priorityWeight = (p) => {
      if (p === "high") return 3;
      if (p === "medium") return 2;
      if (p === "low") return 1;
      return 0;
    };

    let result = safeTickets.filter((t) => {
      if (q) {
        const projectName = projectNameById(t.project_id).toLowerCase();
        const matches =
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          projectName.includes(q);

        if (!matches) return false;
      }

      if (
        filterProject !== "all" &&
        String(t.project_id) !== String(filterProject)
      ) {
        return false;
      }

      return true;
    });

    const dir = sortDirection === "asc" ? 1 : -1;

    result = result.sort((a, b) => {
      let va, vb;

      if (sortField === "title") {
        va = (a.title || "").toLowerCase();
        vb = (b.title || "").toLowerCase();
        return va.localeCompare(vb) * dir;
      }

      if (sortField === "project") {
        va = projectNameById(a.project_id).toLowerCase();
        vb = projectNameById(b.project_id).toLowerCase();
        return va.localeCompare(vb) * dir;
      }

      if (sortField === "priority") {
        va = priorityWeight(a.priority);
        vb = priorityWeight(b.priority);
        return (va - vb) * dir;
      }

      if (sortField === "status") {
        va = (a.status || "").toLowerCase();
        vb = (b.status || "").toLowerCase();
        return va.localeCompare(vb) * dir;
      }

      return (a.id - b.id) * dir;
    });

    return result;
  }, [
    safeTickets,
    searchQuery,
    filterProject,
    sortField,
    sortDirection,
    projectNameById,
  ]);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Tickets
      </Typography>

      {/* Formulario de creación */}
      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          label="Título"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 }, flex: 1 }}
        />
        <TextField
          label="Descripción"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 260 }, flex: 2 }}
        />
        <TextField
          label="Proyecto"
          size="small"
          select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 180 } }}
        >
          {safeProjects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Prioridad"
          size="small"
          select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 140 } }}
        >
          <MenuItem value="low">Baja</MenuItem>
          <MenuItem value="medium">Media</MenuItem>
          <MenuItem value="high">Alta</MenuItem>
        </TextField>
        <TextField
          label="Estado"
          size="small"
          select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 140 } }}
        >
          <MenuItem value="open">Abierto</MenuItem>
          <MenuItem value="pending">Pendiente</MenuItem>
          <MenuItem value="closed">Cerrado</MenuItem>
        </TextField>
        <Button
          variant="contained"
          type="submit"
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          Agregar ticket
        </Button>
      </Box>

      {/* Barra de filtros → solo Proyecto */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          select
          label="Proyecto"
          size="small"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 200 }, maxWidth: 260 }}
        >
          <MenuItem value="all">Todos los proyectos</MenuItem>
          {safeProjects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Tabla */}
      <Card
        sx={{
          bgcolor: "#020617",
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.2)",
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer sx={{ maxHeight: { xs: 400, md: "none" } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: "grey.400", whiteSpace: "nowrap" }}
                    sortDirection={sortField === "id" ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortField === "id"}
                      direction={sortField === "id" ? sortDirection : "asc"}
                      onClick={() => handleSortColumn("id")}
                    >
                      ID
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sx={{ color: "grey.400", whiteSpace: "nowrap" }}
                    sortDirection={
                      sortField === "title" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "title"}
                      direction={
                        sortField === "title" ? sortDirection : "asc"
                      }
                      onClick={() => handleSortColumn("title")}
                    >
                      Título
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sx={{ color: "grey.400", whiteSpace: "nowrap" }}
                    sortDirection={
                      sortField === "project" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "project"}
                      direction={
                        sortField === "project" ? sortDirection : "asc"
                      }
                      onClick={() => handleSortColumn("project")}
                    >
                      Proyecto
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "grey.400",
                      whiteSpace: "nowrap",
                      display: { xs: "none", sm: "table-cell" },
                    }}
                    sortDirection={
                      sortField === "priority" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "priority"}
                      direction={
                        sortField === "priority" ? sortDirection : "asc"
                      }
                      onClick={() => handleSortColumn("priority")}
                    >
                      Prioridad
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "grey.400",
                      whiteSpace: "nowrap",
                      display: { xs: "none", sm: "table-cell" },
                    }}
                    sortDirection={
                      sortField === "status" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "status"}
                      direction={
                        sortField === "status" ? sortDirection : "asc"
                      }
                      onClick={() => handleSortColumn("status")}
                    >
                      Estado
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sx={{ color: "grey.400", textAlign: "right" }}
                    align="right"
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {displayTickets.map((t) => (
                  <TableRow
                    key={t.id}
                    hover
                    onClick={() => handleOpenEdit(t)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{projectNameById(t.project_id)}</TableCell>

                    <TableCell
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      {t.priority === "low"
                        ? "Baja"
                        : t.priority === "medium"
                        ? "Media"
                        : t.priority === "high"
                        ? "Alta"
                        : t.priority}
                    </TableCell>

                    <TableCell
                      sx={{
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", justifyContent: "flex-start" }}
                      >
                        {(() => {
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
                          );
                        })()}
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(t);
                          }}
                          sx={{ minWidth: 0 }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(t);
                          }}
                          sx={{ minWidth: 0 }}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

                {displayTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" sx={{ color: "grey.400" }}>
                        No se encontraron tickets.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

     
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="md">
        <DialogTitle>Editar ticket</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flexWrap: "wrap",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Título"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 220 }, flex: 1 }}
              autoFocus
            />
            <TextField
              label="Descripción"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 260 }, flex: 2 }}
              multiline
              minRows={2}
            />
            <TextField
              label="Proyecto"
              select
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            >
              {safeProjects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Prioridad"
              select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 140 } }}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </TextField>
            <TextField
              label="Estado"
              select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 140 } }}
            >
              <MenuItem value="open">Abierto</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="closed">Cerrado</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Eliminar ticket</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que querés eliminar el ticket{" "}
            <strong>{ticketToDelete?.title}</strong>? Esta acción no se puede
            deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </>
  );
}
