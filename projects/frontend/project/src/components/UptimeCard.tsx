import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Tooltip,
  InputBase,
} from "@mui/material";
import { CheckCircle, Warning, Edit } from "@mui/icons-material";
import { apiService } from "../services/api";

interface UptimeCardProps {
  initialThreshold?: number;
}

export const UptimeCard: React.FC<UptimeCardProps> = ({
  initialThreshold = 100,
}) => {
  const [threshold, setThreshold] = useState(initialThreshold);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialThreshold.toString());

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputSubmit = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val > 0) {
      setThreshold(val);
    } else {
      setInputValue(threshold.toString()); // Reset on invalid
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setInputValue(threshold.toString());
      setIsEditing(false);
    }
  };

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
    <Tooltip
      title={
        isEditing
          ? "Press Enter to save"
          : `Percentage of time where average ping < ${threshold}ms. Click to edit threshold.`
      }
    >
      <Card
        sx={{
          minWidth: 140,
          backgroundColor: isEditing
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
          cursor: isEditing ? "text" : "pointer",
          transition: "background-color 0.2s",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          },
        }}
        onClick={() => {
          setIsEditing(true);
        }}
      >
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
              {isEditing ? (
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 0.5 }}
                  >
                    &lt;
                  </Typography>
                  <InputBase
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleInputSubmit}
                    autoFocus
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "0.7rem",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                      width: "40px",
                      "& input": {
                        padding: 0,
                        textAlign: "center",
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.7)", ml: 0.5 }}
                  >
                    ms
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", alignItems: "center" }}
                  onClick={handleEditClick}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                      borderBottom: "1px dashed rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    Usability ({`<${threshold}ms`})
                  </Typography>
                  <Edit
                    sx={{
                      fontSize: 10,
                      ml: 0.5,
                      opacity: 0.5,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
