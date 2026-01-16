import { AppBar, Toolbar, Typography, Container, Box } from "@mui/material";
import { NetworkCheck } from "@mui/icons-material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GraphController } from "./components/GraphController";
import { DatabaseSizeCard } from "./components/DatabaseSizeCard";
import { UptimeCard } from "./components/UptimeCard";

function App() {
  return (
    <BrowserRouter>
      <AppBar position="static" color="primary">
        <Toolbar>
          <NetworkCheck sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {import.meta.env.VITE_APP_NAME || "Network Lag Monitor"}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <UptimeCard threshold={150} />
            <DatabaseSizeCard />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<GraphController />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
