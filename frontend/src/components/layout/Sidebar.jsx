import {
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PeopleIcon from "@mui/icons-material/People";

export default function Sidebar({ currentView, onChangeView }) {
  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        borderRight: "1px solid rgba(148,163,184,0.2)",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        bgcolor: "#020617",
      }}
    >
   
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          I
        </Box>
        <ListItemText
          primary="IssueHub"
          primaryTypographyProps={{ variant: "h6", fontWeight: 700 }}
        />
      </Box>

    
      <List dense sx={{ mt: 1 }}>
        <ListItem
          button
          onClick={() => onChangeView("dashboard")}
          selected={currentView === "dashboard"}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            cursor: "pointer",
          }}
        >
          <DashboardIcon
            fontSize="small"
            sx={{
              mr: 1,
              color:
                currentView === "dashboard" ? "primary.main" : "grey.400",
            }}
          />
          <ListItemText primary="Panel" />
        </ListItem>

        <ListItem
          button
          onClick={() => onChangeView("tickets")}
          selected={currentView === "tickets"}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            cursor: "pointer",
          }}
        >
          <ConfirmationNumberIcon
            fontSize="small"
            sx={{
              mr: 1,
              color: currentView === "tickets" ? "primary.main" : "grey.400",
            }}
          />
          <ListItemText primary="Tickets" />
        </ListItem>

        <ListItem
          button
          onClick={() => onChangeView("projects")}
          selected={currentView === "projects"}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            cursor: "pointer",
          }}
        >
          <PeopleIcon
            fontSize="small"
            sx={{
              mr: 1,
              color: currentView === "projects" ? "primary.main" : "grey.400",
            }}
          />
          <ListItemText primary="Proyectos" />
        </ListItem>
      </List>

      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );
}
