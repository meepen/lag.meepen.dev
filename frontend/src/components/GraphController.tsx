import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { DateController } from './DateController';
import { Graph } from './Graph';
import { DetailView } from './DetailView';
import { BatchBreakdown } from './BatchBreakdown';
import { apiService } from '../services/api';
import { LagResultDto } from '../types/lag-result.dto';

export const GraphController: React.FC = () => {
  const [lagData, setLagData] = useState<LagResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<{
    timestamp: number;
    batches: LagResultDto[];
  } | null>(null);
  const [highlightTrigger, setHighlightTrigger] = useState<number>(0);
  const [selectedBatch, setSelectedBatch] = useState<LagResultDto | null>(null);

  // Default to 5 minutes ago to now
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const [fromDate, setFromDate] = useState(fiveMinutesAgo);
  const [toDate, setToDate] = useState(now);

  const fetchData = async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getLagData(
        from.toISOString(),
        to.toISOString()
      );
      setLagData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLagData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dates change
  useEffect(() => {
    fetchData(fromDate, toDate);
  }, [fromDate, toDate]);

  const handleDateChange = (from: Date, to: Date) => {
    setFromDate(from);
    setToDate(to);
  };

  const handleDataPointClick = (timestamp: number, batches: LagResultDto[]) => {
    setSelectedData({ timestamp, batches });
    setHighlightTrigger(prev => prev + 1); // Increment to trigger highlight
  };

  const handleBatchClick = (batchId: string) => {
    // Find the batch in lagData and set it as selected
    const batch = lagData.find(b => b.batchId === batchId);
    if (batch) {
      setSelectedBatch(batch);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <DateController
          fromDate={fromDate}
          toDate={toDate}
          onDateChange={handleDateChange}
          loading={loading}
        />
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Graph
          data={lagData}
          loading={loading}
          error={error}
          fromDate={fromDate}
          toDate={toDate}
          onDataPointClick={handleDataPointClick}
        />
      </Box>
      
      <DetailView 
        selectedData={selectedData} 
        highlightTrigger={highlightTrigger} 
        onBatchClick={handleBatchClick}
      />
      
      <BatchBreakdown 
        batch={selectedBatch}
      />
    </Paper>
  );
};
