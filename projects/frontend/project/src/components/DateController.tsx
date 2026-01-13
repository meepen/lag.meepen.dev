import React, { useState, useCallback, useEffect } from "react";
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
  setFromDate: (date?: Date) => void;
  setToDate: (date?: Date) => void;
  setPreset: (preset: TimePreset | null) => void;
  preset?: TimePreset | null;
  toDate?: Date;
  fromDate?: Date;
  loading: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const DateController: React.FC<DateControllerProps> = React.memo(
  ({
    setFromDate,
    setToDate,
    setPreset,
    fromDate,
    toDate,
    preset,
    loading,
  }) => {
    const [autoRefresh, _setAutoRefresh] = useState<boolean>(false);

    const [secondsRemaining, setSecondsRemaining] = useState(60);

    const handleFromChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = parseLocalDateTime(event.target.value);
        setFromDate(newDate);
        setPreset(null);
      },
      [toDate, setFromDate],
    );

    const handleToChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = parseLocalDateTime(event.target.value);
        setPreset(null);
        setToDate(newDate);
      },
      [fromDate, setToDate],
    );

    // Auto-refresh timer logic
    useEffect(() => {
      if (!autoRefresh) {
        setSecondsRemaining(60);
        return;
      }

      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }, [autoRefresh]);

    const updatePreset = useCallback(
      (newPreset: TimePreset) => {
        setPreset(newPreset);
        setFromDate(new Date(Date.now() - getPresetDuration(newPreset)));
        setToDate(new Date());
      },
      [setPreset, setFromDate, setToDate],
    );

    const onRefresh = useCallback(() => {
      // Trigger a data refresh by updating toDate -- let's figure out how
      if (preset) {
        updatePreset(preset);
      } else {
        setToDate(new Date(toDate ?? new Date()));
      }
    }, [preset, toDate, updatePreset, setToDate]);

    if (preset && (!fromDate || !toDate)) {
      // Preset is set but dates are missing, initialize them
      updatePreset(preset);
    } else if (!preset && !fromDate && !toDate) {
      updatePreset("5m");
    }

    const setAllTime = useCallback(() => {
      setPreset(null);
      setFromDate(new Date("2020-01-01"));
      setToDate(new Date());
    }, [setPreset, setFromDate, setToDate]);

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
            value={formatDateForInput(fromDate || new Date())}
            onChange={handleFromChange}
            size="small"
            disabled={loading}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { step: 60 },
            }}
          />

          <TextField
            label="To"
            type="datetime-local"
            value={formatDateForInput(toDate || new Date())}
            onChange={handleToChange}
            size="small"
            disabled={loading}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { step: 60 },
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              size="small"
              disabled={loading}
              onClick={onRefresh}
            >
              {autoRefresh ? `Refresh (${secondsRemaining}s)` : "Refresh"}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              updatePreset("5m");
            }}
            disabled={loading}
          >
            Last 5m
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              updatePreset("1h");
            }}
            disabled={loading}
          >
            Last 1h
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              updatePreset("24h");
            }}
            disabled={loading}
          >
            Last 24h
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              updatePreset("7d");
            }}
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
