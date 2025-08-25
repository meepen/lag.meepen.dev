import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface DateControllerProps {
  fromDate: Date;
  toDate: Date;
  onDateChange: (from: Date, to: Date) => void;
  loading: boolean;
  onRefresh?: () => void;
}

export const DateController: React.FC<DateControllerProps> = ({
  fromDate,
  toDate,
  onDateChange,
  loading,
  onRefresh
}) => {
  const [lastSelectionType, setLastSelectionType] = useState<'preset' | 'manual'>('manual');
  const [lastPresetDuration, setLastPresetDuration] = useState<number | null>(null); // Duration in milliseconds
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setLastSelectionType('manual');
    setLastPresetDuration(null);
    onDateChange(newDate, toDate);
  };

  const handleToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setLastSelectionType('manual');
    setLastPresetDuration(null);
    onDateChange(fromDate, newDate);
  };

  const handleRefresh = () => {
    if (lastSelectionType === 'preset' && lastPresetDuration !== null) {
      // For preset selections, recalculate the time range to current time
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
  };

  const setLast5Minutes = () => {
    const now = new Date();
    const duration = 5 * 60 * 1000;
    const from = new Date(now.getTime() - duration);
    setLastSelectionType('preset');
    setLastPresetDuration(duration);
    onDateChange(from, now);
  };    const setLastHour = () => {
    const now = new Date();
    const duration = 60 * 60 * 1000;
    const from = new Date(now.getTime() - duration);
    setLastSelectionType('preset');
    setLastPresetDuration(duration);
    onDateChange(from, now);
  };

  const setLast24Hours = () => {
    const now = new Date();
    const duration = 24 * 60 * 60 * 1000;
    const twentyFourHoursAgo = new Date(now.getTime() - duration);
    setLastSelectionType('preset');
    setLastPresetDuration(duration);
    onDateChange(twentyFourHoursAgo, now);
  };

  const setLastWeek = () => {
    const now = new Date();
    const duration = 7 * 24 * 60 * 60 * 1000;
    const oneWeekAgo = new Date(now.getTime() - duration);
    setLastSelectionType('preset');
    setLastPresetDuration(duration);
    onDateChange(oneWeekAgo, now);
  };

  const setAllTime = () => {
    const now = new Date();
    // Set to a very early date to get all available data
    const veryEarlyDate = new Date('2020-01-01');
    setLastSelectionType('manual'); // Treat "All Time" as manual since it's not relative
    onDateChange(veryEarlyDate, now);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="From"
          type="datetime-local"
          value={formatDateForInput(fromDate)}
          onChange={handleFromChange}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          label="To"
          type="datetime-local"
          value={formatDateForInput(toDate)}
          onChange={handleToChange}
          size="small"
          InputLabelProps={{ shrink: true }}
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
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
};
