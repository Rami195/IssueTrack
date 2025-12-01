// src/App.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useAppStore from "./store/useAppStore";

import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";

import DashboardView from "./views/DashboardView";
import TicketsView from "./views/TicketsView";
import ProjectsView from "./views/ProjectsView";
import AuthView from "./views/AuthView";
import Config from "./views/Config.jsx";

const drawerWidth = 240;

export default function App() {
  const {
    userName,
    currentView,
    setView,
    fetchProjects,
    fetchTickets,
    error,
    token,
    initAuth,
  } = useAppStore();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth inicial
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Cargar datos cuando ya hay token
  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchTickets();
    }
  }, [token, fetchProjects, fetchTickets]);

  let content = null;
  if (currentView === "tickets") content = <TicketsView />;
  else if (currentView === "projects") content = <ProjectsView />;
  else if (currentView === "config") content = <Config/>;
  else content = <DashboardView />;

  if (!token) {
    return <AuthView />;
  }

  const handleOpenSidebar = () => setMobileOpen(true);
  const handleCloseSidebar = () => setMobileOpen(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#020617",
        color: "grey.100",
      }}
    >
      {/* SIDEBAR ESCRITORIO (permanente) */}
      {isDesktop && (
        <Box
          sx={{
            width: drawerWidth,
            flexShrink: 0,
          }}
        >
          <Sidebar
            currentView={currentView}
            onChangeView={setView}
          />
        </Box>
      )}

      {/* SIDEBAR MÓVIL (Drawer) */}
      {!isDesktop && (
        <Drawer
          open={mobileOpen}
          onClose={handleCloseSidebar}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: drawerWidth,
              bgcolor: "#020617",
            },
          }}
        >
          <Sidebar
            currentView={currentView}
            onChangeView={setView}
            onItemClick={handleCloseSidebar}
          />
        </Drawer>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TopBar con botón hamburguesa en mobile */}
        <TopBar userName={userName} onOpenSidebar={handleOpenSidebar} />

        <Box
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
          }}
        >
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          {content}
        </Box>
      </Box>
    </Box>
  );
}
