// src/App.jsx
import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import useAppStore from "./store/useAppStore";

import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";

import DashboardView from "./views/DashboardView";
import TicketsView from "./views/TicketsView";
import ProjectsView from "./views/ProjectsView";
import AuthView from "./views/AuthView";

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

  
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  
  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchTickets();
    }
  }, [token, fetchProjects, fetchTickets]);


  let content = null;
  if (currentView === "tickets") content = <TicketsView />;
  else if (currentView === "projects") content = <ProjectsView />;
  else content = <DashboardView />;


  if (!token) {
    return <AuthView />;
  }


  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#020617",
        color: "grey.100",
      }}
    >
      <Sidebar currentView={currentView} onChangeView={setView} />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar userName={userName} />

        <Box sx={{ flex: 1, p: 3 }}>
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
