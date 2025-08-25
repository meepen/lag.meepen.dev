import React, { useRef } from 'react';
import { Box, Typography, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LagResultDto } from '../types/lag-result.dto';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';

interface GraphProps {
  data: LagResultDto[];
  loading: boolean;
  error: string | null;
  fromDate: Date;
  toDate: Date;
  onDataPointClick?: (timestamp: number, batches: LagResultDto[]) => void;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  batchCount: number;
}

interface TooltipPayload {
  payload: ChartDataPoint;
  value: number;
  dataKey: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export const Graph: React.FC<GraphProps> = React.memo(({ data, loading, error, fromDate, toDate, onDataPointClick }) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('Graph render #', renderCount.current, { dataLength: data.length, loading, error: !!error });
  
  // Determine grouping interval based on time range
  const getGroupingInterval = (from: Date, to: Date): { minutes: number; label: string } => {
    const durationMs = to.getTime() - from.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 1) {
      return { minutes: 1, label: '1 minute' };
    } else if (durationHours < 24) {
      return { minutes: 5, label: '5 minutes' };
    } else if (durationHours < 24 * 7) {
      return { minutes: 20, label: '20 minutes' };
    } else if (durationHours < 24 * 30){
      return { minutes: 120, label: '2 hours' };
    } else {
      return { minutes: 1440, label: '1 day' };
    }
  };

  // Group data by specified interval and calculate averages
  const processDataForChart = (batches: LagResultDto[], groupingMinutes: number): ChartDataPoint[] => {
    const minuteGroups = new Map<string, {
      latencies: number[];
      minLatency: number;
      maxLatency: number;
      batchCount: number;
      timestamp: number;
    }>();

    batches.forEach(batch => {
      // Round down to the specified grouping interval
      const date = new Date(batch.createdAt);
      const minutes = date.getMinutes();
      const roundedMinutes = Math.floor(minutes / groupingMinutes) * groupingMinutes;
      date.setMinutes(roundedMinutes, 0, 0);
      const intervalKey = date.toISOString();
      
      // Use only the last hop (final destination) from each batch
      if (batch.results.length > 0) {
        const lastHop = batch.results[batch.results.length - 1];
        const batchAvgLatency = lastHop.averageMs;
        const batchMinLatency = lastHop.bestMs;
        const batchMaxLatency = lastHop.worstMs;
        
        if (!minuteGroups.has(intervalKey)) {
          minuteGroups.set(intervalKey, {
            latencies: [],
            minLatency: batchMinLatency,
            maxLatency: batchMaxLatency,
            batchCount: 0,
            timestamp: date.getTime()
          });
        }
        
        const group = minuteGroups.get(intervalKey)!;
        group.latencies.push(batchAvgLatency);
        group.minLatency = Math.min(group.minLatency, batchMinLatency);
        group.maxLatency = Math.max(group.maxLatency, batchMaxLatency);
        group.batchCount++;
      }
    });

    // Convert to chart data points
    return Array.from(minuteGroups.entries())
      .map(([timeStr, group]) => ({
        time: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: group.timestamp,
        averageLatency: Number((group.latencies.reduce((sum, lat) => sum + lat, 0) / group.latencies.length).toFixed(2)),
        minLatency: Number(group.minLatency.toFixed(2)),
        maxLatency: Number(group.maxLatency.toFixed(2)),
        batchCount: group.batchCount
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading lag data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Alert severity="info">
        No data available for the selected time range.
      </Alert>
    );
  }

  const groupingInterval = getGroupingInterval(fromDate, toDate);
  const chartData = processDataForChart(data, groupingInterval.minutes);
  
  // Handle chart click events
  const handleChartClick: CategoricalChartFunc = (event) => {
    // Try to find the clicked data point from the event
    let clickedPoint: ChartDataPoint | null = null;
    
    // Check various possible locations for the data
    if (event.activeLabel) {
      // Find the data point by matching the time label
      clickedPoint = chartData.find(point => point.time === event.activeLabel) || null;
    }
    
    if (clickedPoint) {
      const timestamp = clickedPoint.timestamp;
      
      // Find all batches that fall within this time interval
      const intervalMs = groupingInterval.minutes * 60 * 1000;
      const batchesInInterval = data.filter((batch: LagResultDto) => {
        const batchTime = new Date(batch.createdAt).getTime();
        return batchTime >= timestamp && batchTime < timestamp + intervalMs;
      });

      onDataPointClick?.(timestamp, batchesInInterval);
    }
  };
  
  if (chartData.length === 0) {
    return (
      <Alert severity="warning">
        No valid latency data found in the selected batches.
      </Alert>
    );
  }

  // Calculate summary stats
  const totalBatches = data.length;
  const totalTests = data.reduce((sum, batch) => sum + batch.testCount, 0);
  const overallAvgLatency = chartData.reduce((sum, point) => sum + point.averageLatency, 0) / chartData.length;

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          backgroundColor: 'background.paper', 
          border: 1, 
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          boxShadow: 2
        }}>
          <Typography variant="body2" fontWeight="bold">
            Time: {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Avg Latency: {data.averageLatency}ms
          </Typography>
          <Typography variant="body2" color="success.main">
            Min: {data.minLatency}ms
          </Typography>
          <Typography variant="body2" color="error.main">
            Max: {data.maxLatency}ms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Batches: {data.batchCount}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {totalBatches}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Batches
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {overallAvgLatency.toFixed(1)}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Latency
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {chartData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data Points
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {totalTests}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tests
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
      {/* Chart */}
      <Card sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="averageLatency" 
              stroke="#1976d2" 
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Average Latency"
            />
            <Line 
              type="monotone" 
              dataKey="minLatency" 
              stroke="#4caf50" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={{ r: 2 }}
              name="Min Latency"
            />
            <Line 
              type="monotone" 
              dataKey="maxLatency" 
              stroke="#f44336" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={{ r: 2 }}
              name="Max Latency"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
});
