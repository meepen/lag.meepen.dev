import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Tooltip,
} from "@mui/material";
import { CheckCircle, Warning } from "@mui/icons-material";
import { apiService } from "../services/api";

interface UptimeCardProps {
  threshold?: number;
}

export const UptimeCard: React.FC<UptimeCardProps> = ({ threshold = 100 }) => {
  const [uptime, setUptime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService
      .getUptimeStats(threshold)
      .then((data) => {
        setUptime(data.uptimePercentage);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch uptime statistics",
        );
        setUptime(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [threshold]);

  if (loading) {
    return (
      <Card sx={{ minWidth: 140, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
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
            <Warning sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
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

  const isGood = uptime !== null && uptime > 95;

  return (
    <Tooltip title={`Percentage of time where average ping < ${threshold}ms`}>
      <Card sx={{ minWidth: 140, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isGood ? (
              <CheckCircle sx={{ color: "rgba(255, 255, 255, 0.9)" }} />
            ) : (
              <Warning sx={{ color: "rgba(255, 255, 255, 0.9)" }} />
            )}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontWeight: "bold",
                  lineHeight: 1.2,
                }}
              >
                {uptime !== null ? `${uptime.toFixed(2)}%` : "N/A"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.7rem",
                }}
              >
                Usability ({`<${threshold}ms`})
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
