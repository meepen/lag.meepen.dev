import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface DateControllerProps {
  fromDate: Date;
  toDate: Date;
  onDateChange: (from: Date, to: Date) => void;
  loading: boolean;
}

export const DateController: React.FC<DateControllerProps> = ({
  fromDate,
  toDate,
  onDateChange,
  loading
}) => {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    onDateChange(newDate, toDate);
  };

  const handleToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    onDateChange(fromDate, newDate);
  };

  const handleRefresh = () => {
    onDateChange(fromDate, toDate);
  };

  const setLast5Minutes = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    onDateChange(fiveMinutesAgo, now);
  };

  const setLastHour = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    onDateChange(oneHourAgo, now);
  };

  const setLast24Hours = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    onDateChange(twentyFourHoursAgo, now);
  };

  const setLastWeek = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    onDateChange(oneWeekAgo, now);
  };

  const setAllTime = () => {
    const now = new Date();
    // Set to a very early date to get all available data
    const veryEarlyDate = new Date('2020-01-01');
    onDateChange(veryEarlyDate, now);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Time Range
      </Typography>
      
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
