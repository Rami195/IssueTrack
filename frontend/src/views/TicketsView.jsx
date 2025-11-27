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

  // edición (dialog)
  const [editOpen, setEditOpen] = useState(false);
  const [editTicketId, setEditTicketId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editStatus, setEditStatus] = useState("open");
  const [editProjectId, setEditProjectId] = useState("");

  // 👉 único filtro visible arriba: por project
  const [filterProject, setFilterProject] = useState("all");

  // orden (click en encabezados)
  const [sortField, setSortField] = useState("id"); // id | title | project | priority | status
  const [sortDirection, setSortDirection] = useState("desc");

  const projectNameById = useCallback(
    (id) => safeProjects.find((p) => p.id === id)?.name || `#${id}`,
    [safeProjects]
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const payload = {
      title,
      description,
      status,
      priority,
      project_id: Number(projectId),
    };

    await createTicket(payload);

    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("open");
    setProjectId("");
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
    if (!editTicketId || !editTitle.trim() || !editProjectId) return;

    const payload = {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      status: editStatus,
      project_id: Number(editProjectId),
    };

    await updateTicket(editTicketId, payload);
    handleCloseEdit();
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este ticket?")) {
      await deleteTicket(id);
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

  // 🔎 filtros + orden
  const displayTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const priorityWeight = (p) => {
      if (p === "high") return 3;
      if (p === "medium") return 2;
      if (p === "low") return 1;
      return 0;
    };

    let result = safeTickets.filter((t) => {
      // búsqueda (title / description / nombre de project)
      if (q) {
        const projectName = projectNameById(t.project_id).toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          projectName.includes(q);

        if (!matches) return false;
      }

      // único filtro: por proyecto
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

      // default: ordenar por id
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

      {/* Form creación */}
      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <TextField
          label="Title"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          label="Description"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <TextField
          label="Project"
          size="small"
          select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {safeProjects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Priority"
          size="small"
          select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </TextField>
        <TextField
          label="Status"
          size="small"
          select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>
        <Button variant="contained" type="submit">
          Add ticket
        </Button>
      </Box>

      {/* 🔽 barra de filtros → solo Project */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
          alignItems: "center",
        }}
      >
        <TextField
          select
          label="Project"
          size="small"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All projects</MenuItem>
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
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: "grey.400" }}
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
                  sx={{ color: "grey.400" }}
                  sortDirection={sortField === "title" ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortField === "title"}
                    direction={sortField === "title" ? sortDirection : "asc"}
                    onClick={() => handleSortColumn("title")}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  sx={{ color: "grey.400" }}
                  sortDirection={sortField === "project" ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortField === "project"}
                    direction={sortField === "project" ? sortDirection : "asc"}
                    onClick={() => handleSortColumn("project")}
                  >
                    Project
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  sx={{ color: "grey.400" }}
                  sortDirection={
                    sortField === "priority" ? sortDirection : false
                  }
                >
                  <TableSortLabel
                    active={sortField === "priority"}
                    direction={sortField === "priority" ? sortDirection : "asc"}
                    onClick={() => handleSortColumn("priority")}
                  >
                    Priority
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  sx={{ color: "grey.400" }}
                  sortDirection={sortField === "status" ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortField === "status"}
                    direction={sortField === "status" ? sortDirection : "asc"}
                    onClick={() => handleSortColumn("status")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ color: "grey.400" }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{projectNameById(t.project_id)}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleOpenEdit(t)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {displayTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" sx={{ color: "grey.400" }}>
                      No tickets found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog edición */}
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="md">
        <DialogTitle>Edit ticket</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              sx={{ minWidth: 220 }}
              autoFocus
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{ minWidth: 260 }}
              multiline
              minRows={2}
            />
            <TextField
              label="Project"
              select
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {safeProjects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Priority"
              select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              label="Status"
              select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
