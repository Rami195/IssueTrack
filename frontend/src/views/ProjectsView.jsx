import { useState, useMemo } from "react";
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

export default function ProjectsView() {
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    searchQuery,
  } = useAppStore();

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeSearch =
    typeof searchQuery === "string" ? searchQuery : String(searchQuery || "");

  // creación
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // edición
  const [editOpen, setEditOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // filtro (placeholder)
  const [filterType, setFilterType] = useState("all");

  // orden
  const [sortField, setSortField] = useState("id"); // id | name | created_at | updated_at
  const [sortDirection, setSortDirection] = useState("asc");

  const handleCreate = async (e) => {
    // soporta tanto onSubmit como onClick manual
    e?.preventDefault?.();

    if (!name.trim()) return;

    if (typeof createProject !== "function") {
      console.error("createProject NO es una función:", createProject);
      alert("Error interno: createProject no es una función");
      return;
    }

    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
      });

      setName("");
      setDescription("");
    } catch (err) {
      console.error("Error al crear proyecto:", err);
      alert(err?.message || "Error al crear proyecto");
    }
  };

  const handleOpenEdit = (project) => {
    setEditProjectId(project.id);
    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditProjectId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async () => {
    if (!editProjectId || !editName.trim()) return;

    if (typeof updateProject !== "function") {
      console.error("updateProject NO es una función:", updateProject);
      alert("Error interno: updateProject no es una función");
      return;
    }

    try {
      await updateProject(editProjectId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      handleCloseEdit();
    } catch (err) {
      console.error("Error al actualizar proyecto:", err);
      alert(err?.message || "Error al actualizar proyecto");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este proyecto?")) return;

    if (typeof deleteProject !== "function") {
      console.error("deleteProject NO es una función:", deleteProject);
      alert("Error interno: deleteProject no es una función");
      return;
    }

    try {
      await deleteProject(id);
    } catch (err) {
      console.error("Error al eliminar proyecto:", err);
      alert(err?.message || "Error al eliminar proyecto");
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

  const displayProjects = useMemo(() => {
    const q = safeSearch.trim().toLowerCase();

    let result = safeProjects.filter((p) => {
      if (q) {
        const matches =
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // placeholder para filterType (por ahora “all” no filtra nada)
      if (filterType !== "all") {
        return true;
      }

      return true;
    });

    const dir = sortDirection === "asc" ? 1 : -1;

    result = result.sort((a, b) => {
      if (sortField === "name") {
        const va = (a.name || "").toLowerCase();
        const vb = (b.name || "").toLowerCase();
        return va.localeCompare(vb) * dir;
      }

      if (sortField === "created_at") {
        const va = new Date(a.created_at || 0).getTime();
        const vb = new Date(b.created_at || 0).getTime();
        return (va - vb) * dir;
      }

      if (sortField === "updated_at") {
        const va = new Date(a.updated_at || 0).getTime();
        const vb = new Date(b.updated_at || 0).getTime();
        return (va - vb) * dir;
      }

      // default: id
      return ((a.id || 0) - (b.id || 0)) * dir;
    });

    return result;
  }, [safeProjects, safeSearch, filterType, sortField, sortDirection]);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Projects
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
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <TextField
          label="Description"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" type="submit">
          Add project
        </Button>
      </Box>

      {/* Barra de filtros */}
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
          label="Filter"
          size="small"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All projects</MenuItem>
        </TextField>
      </Box>

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
                  sortDirection={sortField === "name" ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortField === "name"}
                    direction={sortField === "name" ? sortDirection : "asc"}
                    onClick={() => handleSortColumn("name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ color: "grey.400" }}>Description</TableCell>

                <TableCell
                  sx={{ color: "grey.400" }}
                  sortDirection={
                    sortField === "created_at" ? sortDirection : false
                  }
                >
                  <TableSortLabel
                    active={sortField === "created_at"}
                    direction={
                      sortField === "created_at" ? sortDirection : "asc"
                    }
                    onClick={() => handleSortColumn("created_at")}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  sx={{ color: "grey.400" }}
                  sortDirection={
                    sortField === "updated_at" ? sortDirection : false
                  }
                >
                  <TableSortLabel
                    active={sortField === "updated_at"}
                    direction={
                      sortField === "updated_at" ? sortDirection : "asc"
                    }
                    onClick={() => handleSortColumn("updated_at")}
                  >
                    Updated
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ color: "grey.400" }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayProjects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>
                    {p.created_at && new Date(p.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {p.updated_at && new Date(p.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleOpenEdit(p)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {displayProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" sx={{ color: "grey.400" }}>
                      No projects found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal edición */}
      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit project</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              multiline
              minRows={2}
            />
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
