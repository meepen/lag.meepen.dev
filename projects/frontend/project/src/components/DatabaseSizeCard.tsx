import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import { Storage } from "@mui/icons-material";
import { apiService } from "../services/api";
import { formatBytes } from "../utils/formatBytes";

export const DatabaseSizeCard: React.FC = () => {
  const [size, setSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService
      .getDatabaseSize()
      .then((data) => {
        setSize(data.bytes);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to fetch database size",
        );
        setSize(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card sx={{ minWidth: 140, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storage sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
            <CircularProgress
              size={16}
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ minWidth: 140, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storage sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Error
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 140, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Storage sx={{ color: "rgba(255, 255, 255, 0.9)" }} />
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {size !== null ? formatBytes(size) : "N/A"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.7rem",
              }}
            >
              Database
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
