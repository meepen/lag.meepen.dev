import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, Close } from '@mui/icons-material';
import { LagResultDto } from '../types/lag-result.dto';

interface DetailViewProps {
  selectedData: {
    timestamp: number;
    batches: LagResultDto[];
  } | null;
  highlightTrigger?: number; // Add this prop to trigger highlighting
  onBatchClick?: (batchId: string) => void; // Add callback for batch row clicks
  onClose?: () => void; // Add callback for closing the detail view
}

type SortColumn = 'time' | 'average' | 'min' | 'max' | 'stdDev';
type SortDirection = 'asc' | 'desc';

export const DetailView: React.FC<DetailViewProps> = React.memo(({ selectedData, highlightTrigger, onBatchClick, onClose }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('average');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [batchDetailsExpanded, setBatchDetailsExpanded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const detailViewRef = useRef<HTMLDivElement>(null);

  // Handle highlighting when a new data point is clicked
  useEffect(() => {
    if (highlightTrigger && selectedData) {
      // Scroll to the detail view
      detailViewRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Trigger highlight animation
      setIsHighlighted(true);
      
      // Remove highlight after animation
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2000); // 2 seconds highlight duration
      
      return () => clearTimeout(timer);
    }
  }, [highlightTrigger, selectedData]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (batchId: string) => {
    if (onBatchClick) {
      onBatchClick(batchId);
    }
  };
  if (!selectedData) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary" align="center">
            Click on a data point in the chart to see detailed information
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { timestamp, batches } = selectedData;
  const selectedTime = new Date(timestamp);

  // Sort batches based on current sort settings
  const sortedBatches = [...batches].sort((a, b) => {
    const aFinalHop = a.results[a.results.length - 1];
    const bFinalHop = b.results[b.results.length - 1];
    
    let aValue: number, bValue: number;
    
    switch (sortColumn) {
      case 'time':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'average':
        aValue = aFinalHop?.averageMs || 0;
        bValue = bFinalHop?.averageMs || 0;
        break;
      case 'min':
        aValue = aFinalHop?.bestMs || 0;
        bValue = bFinalHop?.bestMs || 0;
        break;
      case 'max':
        aValue = aFinalHop?.worstMs || 0;
        bValue = bFinalHop?.worstMs || 0;
        break;
      case 'stdDev':
        aValue = aFinalHop?.standardDeviationMs || 0;
        bValue = bFinalHop?.standardDeviationMs || 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }
    
    const result = aValue - bValue;
    return sortDirection === 'asc' ? result : -result;
  });

  // Calculate aggregate stats for this time period
  const totalTests = batches.reduce((sum, batch) => sum + batch.testCount, 0);
  const finalHops = batches.map(batch => batch.results[batch.results.length - 1]).filter(Boolean);
  
  const avgLatency = finalHops.length > 0 
    ? finalHops.reduce((sum, hop) => sum + hop.averageMs, 0) / finalHops.length 
    : 0;
  const minLatency = finalHops.length > 0 ? Math.min(...finalHops.map(hop => hop.bestMs)) : 0;
  const maxLatency = finalHops.length > 0 ? Math.max(...finalHops.map(hop => hop.worstMs)) : 0;

  return (
    <Box 
      ref={detailViewRef}
      sx={{
        transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
        ...(isHighlighted && {
          boxShadow: '0 0 20px rgba(25, 118, 210, 0.5)',
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          borderRadius: 1,
        })
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Detailed View - {selectedTime.toLocaleString()}
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {batches.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Batches
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
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="primary">
              {avgLatency.toFixed(1)}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Latency
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="success.main">
              {minLatency.toFixed(1)}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Min Latency
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h4" color="error.main">
              {maxLatency.toFixed(1)}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max Latency
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Batch Details Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Batch Details
            </Typography>
            <IconButton 
              onClick={() => setBatchDetailsExpanded(!batchDetailsExpanded)}
              size="small"
            >
              {batchDetailsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'time'}
                      direction={sortColumn === 'time' ? sortDirection : 'asc'}
                      onClick={() => handleSort('time')}
                    >
                      Time
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'average'}
                      direction={sortColumn === 'average' ? sortDirection : 'asc'}
                      onClick={() => handleSort('average')}
                    >
                      Average Latency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'min'}
                      direction={sortColumn === 'min' ? sortDirection : 'asc'}
                      onClick={() => handleSort('min')}
                    >
                      Min Latency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'max'}
                      direction={sortColumn === 'max' ? sortDirection : 'asc'}
                      onClick={() => handleSort('max')}
                    >
                      Max Latency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'stdDev'}
                      direction={sortColumn === 'stdDev' ? sortDirection : 'asc'}
                      onClick={() => handleSort('stdDev')}
                    >
                      Std Deviation
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Always show top 3 results */}
                {(batchDetailsExpanded ? sortedBatches : sortedBatches.slice(0, 3)).map((batch) => {
                  const finalHop = batch.results[batch.results.length - 1];
                  
                  // Use average latency to determine color thresholds
                  const avgLatency = finalHop?.averageMs || 0;
                  const getLatencyColor = () => {
                    if (avgLatency < 50) return "success.main";      // Green for good latency
                    if (avgLatency < 100) return "warning.main";     // Orange for moderate latency
                    return "error.main";                             // Red for high latency
                  };
                  
                  return (
                    <TableRow 
                      key={batch.batchId}
                      onClick={() => handleRowClick(batch.batchId)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: 'background-color 0.2s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {batch.createdAt.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          {finalHop ? `${finalHop.averageMs.toFixed(1)}ms` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={finalHop ? getLatencyColor() : "text.secondary"}>
                          {finalHop ? `${finalHop.bestMs.toFixed(1)}ms` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={finalHop ? getLatencyColor() : "text.secondary"}>
                          {finalHop ? `${finalHop.worstMs.toFixed(1)}ms` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {finalHop ? `${finalHop.standardDeviationMs.toFixed(1)}ms` : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!batchDetailsExpanded && sortedBatches.length > 3 && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  '&:hover': { color: 'primary.dark' }
                }}
                onClick={() => setBatchDetailsExpanded(true)}
              >
                Showing top 3 of {sortedBatches.length} batches. Click to expand.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});
