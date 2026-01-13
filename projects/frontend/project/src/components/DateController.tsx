import React, { useState, useCallback } from "react";
import { Box, TextField, Button } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import type { TimePreset } from "../utils/urlParams";

// Helper function to get duration from preset
function getPresetDuration(preset: TimePreset): number {
  switch (preset) {
    case "5m":
      return 5 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

// Format a Date object as a local datetime string suitable for a datetime-local input
// Using toISOString() caused UTC conversion which shifted hours/dates unexpectedly for users.
const formatDateForInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Parse a datetime-local string explicitly as local time (avoids timezone flips + implicit UTC conversion)
const parseLocalDateTime = (value: string): Date => {
  // Expected format: YYYY-MM-DDTHH:MM (seconds optional but we ignore)
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return new Date(value);
  } // fallback
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  // Construct using local time parts
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
};

interface DateControllerProps {
  fromDate: Date;
  toDate: Date;
  onDateChange: (from: Date, to: Date) => void;
  onPresetChange?: (preset: TimePreset) => void;
  onPresetRefresh?: (preset: TimePreset) => void;
  loading: boolean;
  onRefresh?: () => void;
  initialPreset?: TimePreset | null; // To initialize the preset state from URL
}

export const DateController: React.FC<DateControllerProps> = React.memo(
  ({
    fromDate,
    toDate,
    onDateChange,
    onPresetChange,
    onPresetRefresh,
    loading,
    onRefresh,
    initialPreset,
  }) => {
    const [lastSelectionType, setLastSelectionType] = useState<
      "preset" | "manual"
    >(initialPreset ? "preset" : "manual");
    const [lastPresetDuration, setLastPresetDuration] = useState<number | null>(
      initialPreset ? getPresetDuration(initialPreset) : null,
    );
    const [lastPreset, setLastPreset] = useState<TimePreset | null>(
      initialPreset || null,
    );

    const handleFromChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = parseLocalDateTime(event.target.value);
        setLastSelectionType("manual");
        setLastPresetDuration(null);
        setLastPreset(null);
        onDateChange(newDate, toDate);
      },
      [toDate, onDateChange],
    );

    const handleToChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = parseLocalDateTime(event.target.value);
        setLastSelectionType("manual");
        setLastPresetDuration(null);
        setLastPreset(null);
        onDateChange(fromDate, newDate);
      },
      [fromDate, onDateChange],
    );

    const handleRefresh = useCallback(() => {
      if (lastSelectionType === "preset" && lastPreset && onPresetRefresh) {
        // For preset selections, refresh using the preset callback to maintain URL structure
        onPresetRefresh(lastPreset);
      } else if (
        lastSelectionType === "preset" &&
        lastPresetDuration !== null
      ) {
        // Fallback: recalculate the time range to current time
        const now = new Date();
        const from = new Date(now.getTime() - lastPresetDuration);
        onDateChange(from, now);
      } else {
        // For manual selections, use the external refresh callback if provided
        if (onRefresh) {
          onRefresh();
        } else {
          // Fallback to keeping the same time range
          onDateChange(fromDate, toDate);
        }
      }
    }, [
      lastSelectionType,
      lastPreset,
      lastPresetDuration,
      onPresetRefresh,
      onRefresh,
      fromDate,
      toDate,
      onDateChange,
    ]);

    const setLast5Minutes = useCallback(() => {
      setLastSelectionType("preset");
      setLastPresetDuration(5 * 60 * 1000);
      setLastPreset("5m");

      if (onPresetChange) {
        onPresetChange("5m");
      } else {
        const now = new Date();
        const from = new Date(now.getTime() - 5 * 60 * 1000);
        onDateChange(from, now);
      }
    }, [onPresetChange, onDateChange]);

    const setLastHour = useCallback(() => {
      setLastSelectionType("preset");
      setLastPresetDuration(60 * 60 * 1000);
      setLastPreset("1h");

      if (onPresetChange) {
        onPresetChange("1h");
      } else {
        const now = new Date();
        const from = new Date(now.getTime() - 60 * 60 * 1000);
        onDateChange(from, now);
      }
    }, [onPresetChange, onDateChange]);

    const setLast24Hours = useCallback(() => {
      setLastSelectionType("preset");
      setLastPresetDuration(24 * 60 * 60 * 1000);
      setLastPreset("24h");

      if (onPresetChange) {
        onPresetChange("24h");
      } else {
        const now = new Date();
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000,
        );
        onDateChange(twentyFourHoursAgo, now);
      }
    }, [onPresetChange, onDateChange]);

    const setLastWeek = useCallback(() => {
      setLastSelectionType("preset");
      setLastPresetDuration(7 * 24 * 60 * 60 * 1000);
      setLastPreset("7d");

      if (onPresetChange) {
        onPresetChange("7d");
      } else {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        onDateChange(oneWeekAgo, now);
      }
    }, [onPresetChange, onDateChange]);

    const setAllTime = useCallback(() => {
      const now = new Date();
      // Set to a very early date to get all available data
      const veryEarlyDate = new Date("2020-01-01");
      setLastSelectionType("manual"); // Treat "All Time" as manual since it's not relative
      setLastPresetDuration(null);
      setLastPreset(null);
      onDateChange(veryEarlyDate, now);
    }, [onDateChange]);

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="From"
            type="datetime-local"
            value={formatDateForInput(fromDate)}
            onChange={handleFromChange}
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { step: 60 },
            }}
          />

          <TextField
            label="To"
            type="datetime-local"
            value={formatDateForInput(toDate)}
            onChange={handleToChange}
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { step: 60 },
            }}
          />

          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={<Refresh />}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="text"
            size="small"
            onClick={setLast5Minutes}
            disabled={loading}
          >
            Last 5m
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={setLastHour}
            disabled={loading}
          >
            Last 1h
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={setLast24Hours}
            disabled={loading}
          >
            Last 24h
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={setLastWeek}
            disabled={loading}
          >
            Last Week
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={setAllTime}
            disabled={loading}
          >
            All Time
          </Button>
        </Box>
      </Box>
    );
  },
);
