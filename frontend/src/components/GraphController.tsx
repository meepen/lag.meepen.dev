import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { DateController } from './DateController';
import { Graph } from './Graph';
import { DetailView } from './DetailView';
import { BatchBreakdown } from './BatchBreakdown';
import { apiService } from '../services/api';
import { LagResultDto } from '../types/lag-result.dto';
import { parseTimeParams, createTimeUrl, getDateRangeFromParams, type TimePreset } from '../utils/urlParams';

export const GraphController: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lagData, setLagData] = useState<LagResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [batchHighlightTrigger, setBatchHighlightTrigger] = useState(0);

  // Refs for stable callbacks and storing selected batches
  const searchParamsRef = useRef(searchParams);
  const setSearchParamsRef = useRef(setSearchParams);
  const selectedBatchesRef = useRef<LagResultDto[]>([]);

  // Parse current URL parameters - single source of truth
  const urlParams = useMemo(() => parseTimeParams(searchParams), [searchParams]);
  
  // Store stable date range - only update when explicitly changed
  const [stableDateRange, setStableDateRange] = useState(() => {
    return getDateRangeFromParams(urlParams);
  });
  
  // Update stable dates only when URL parameters change in a way that should trigger data fetch
  const lastUrlKey = useRef('');
  useEffect(() => {
    const currentUrlKey = `${urlParams.from}-${urlParams.to}-${urlParams.preset}`;
    if (currentUrlKey !== lastUrlKey.current) {
      lastUrlKey.current = currentUrlKey;
      setStableDateRange(getDateRangeFromParams(urlParams));
    }
  }, [urlParams]);
  
  const fromDate = stableDateRange.from;
  const toDate = stableDateRange.to;
  
  const selectedTimestamp = urlParams.selectedTimestamp ? parseInt(urlParams.selectedTimestamp, 10) : null;
  const selectedBatchId = urlParams.selectedBatch;
  
  // Memoize selectedData computation to use the exact batches from graph click
  const selectedData = useMemo(() => {
    if (!selectedTimestamp || lagData.length === 0) return null;
    
    // If we have batches from the graph click, use those exactly
    if (selectedBatchesRef.current.length > 0) {
      return { 
        timestamp: selectedTimestamp, 
        batches: selectedBatchesRef.current 
      };
    }
    
    // Fallback to the old method if no stored batches (shouldn't happen with graph clicks)
    const batchesAtTimestamp = lagData.filter(batch => {
      const batchTime = new Date(batch.createdAt).getTime();
      return Math.abs(batchTime - selectedTimestamp) <= 30000;
    });
    
    return batchesAtTimestamp.length > 0 ? { 
      timestamp: new Date(batchesAtTimestamp[0].createdAt).getTime(), 
      batches: batchesAtTimestamp 
    } : null;
  }, [selectedTimestamp, lagData]);
  
  // Memoize selectedBatch computation
  const selectedBatch = useMemo(() => {
    if (!selectedBatchId || lagData.length === 0) return null;
    return lagData.find(b => b.batchId === selectedBatchId) || null;
  }, [selectedBatchId, lagData]);

  // Simple URL update function
  const updateUrl = useCallback((params: Partial<{
    from: Date;
    to: Date;
    preset: TimePreset | null;
    selectedTimestamp: number | null;
    selectedBatch: string | null;
  }>) => {
    const currentParams = parseTimeParams(searchParams);
    const newParams = {
      from: params.from ? formatDateForUrl(params.from) : currentParams.from,
      to: params.to ? formatDateForUrl(params.to) : currentParams.to,
      preset: params.preset !== undefined ? (params.preset || undefined) : currentParams.preset,
      selectedTimestamp: params.selectedTimestamp !== undefined ? 
        (params.selectedTimestamp ? params.selectedTimestamp.toString() : undefined) : 
        currentParams.selectedTimestamp,
      selectedBatch: params.selectedBatch !== undefined ? 
        (params.selectedBatch || undefined) : 
        currentParams.selectedBatch,
    };
    
    const urlString = createTimeUrl(newParams);
    setSearchParams(urlString);
  }, [searchParams, setSearchParams]);

  // Data fetching
  const fetchData = useCallback(async (from: Date, to: Date) => {
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
  }, []);

  // Event handlers

  // Fetch data when date range changes
  const lastFetchedDates = useRef({ from: '', to: '' });
  
  useEffect(() => {
    const fromStr = fromDate.toISOString();
    const toStr = toDate.toISOString();
    
    // Only fetch if dates actually changed
    if (lastFetchedDates.current.from !== fromStr || lastFetchedDates.current.to !== toStr) {
      lastFetchedDates.current = { from: fromStr, to: toStr };
      fetchData(fromDate, toDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]); // fetchData is stable with empty deps

  // Validate selected parameters against loaded data and clear if invalid
  useEffect(() => {
    if (lagData.length === 0) return; // Wait for data to load
    
    let shouldUpdateUrl = false;
    const urlUpdates: Partial<{
      selectedTimestamp: number | null;
      selectedBatch: string | null;
    }> = {};

    // Check if selected timestamp is valid (has data within 30 seconds)
    if (selectedTimestamp) {
      const hasValidTimestamp = lagData.some(batch => {
        const batchTime = new Date(batch.createdAt).getTime();
        return Math.abs(batchTime - selectedTimestamp) <= 30000;
      });
      
      if (!hasValidTimestamp) {
        urlUpdates.selectedTimestamp = null;
        urlUpdates.selectedBatch = null; // Also clear batch if timestamp is invalid
        shouldUpdateUrl = true;
      }
    }

    // Check if selected batch is valid
    if (selectedBatchId && !urlUpdates.selectedBatch) {
      const hasValidBatch = lagData.some(batch => batch.batchId === selectedBatchId);
      
      if (!hasValidBatch) {
        urlUpdates.selectedBatch = null;
        shouldUpdateUrl = true;
      }
    }

    // Update URL if any parameters are invalid
    if (shouldUpdateUrl) {
      updateUrl(urlUpdates);
    }
  }, [lagData, selectedTimestamp, selectedBatchId, updateUrl]);

  // Event handlers - these only update URL, components react to URL changes
  const handleDateChange = useCallback((from: Date, to: Date) => {
    updateUrl({ from, to, preset: null });
  }, [updateUrl]);

  const handlePresetChange = useCallback((preset: TimePreset) => {
    updateUrl({ preset });
    // Force update of stable dates for new preset
    setStableDateRange(getDateRangeFromParams({ ...urlParams, preset }));
  }, [updateUrl, urlParams]);

  const handleRefresh = useCallback(() => {
    // If we have a preset, recalculate the date range to get fresh "now" time
    if (urlParams.preset) {
      const freshDateRange = getDateRangeFromParams(urlParams);
      setStableDateRange(freshDateRange);
      fetchData(freshDateRange.from, freshDateRange.to);
    } else {
      fetchData(fromDate, toDate);
    }
  }, [urlParams, fetchData, fromDate, toDate]);

  const handlePresetRefresh = useCallback((preset: TimePreset) => {
    // When refreshing a preset, recalculate dates to current time
    const freshParams = { ...urlParams, preset };
    const freshDateRange = getDateRangeFromParams(freshParams);
    setStableDateRange(freshDateRange);
    fetchData(freshDateRange.from, freshDateRange.to);
  }, [urlParams, fetchData]);

  const handleBatchClick = useCallback((batchId: string) => {
    updateUrl({ selectedBatch: batchId });
    setBatchHighlightTrigger(prev => prev + 1);
  }, [updateUrl]);

  const handleCloseDetailView = useCallback(() => {
    selectedBatchesRef.current = []; // Clear stored batches when closing
    updateUrl({ selectedTimestamp: null, selectedBatch: null });
  }, [updateUrl]);

  const handleCloseBatchBreakdown = useCallback(() => {
    updateUrl({ selectedBatch: null });
  }, [updateUrl]);

  // Create stable graph props that only change when the actual data changes
  // Use a stable callback with ref to avoid recreating on every URL change
  
  // Update refs when values change
  useEffect(() => {
    searchParamsRef.current = searchParams;
    setSearchParamsRef.current = setSearchParams;
  });

  // Clear stored batches when lag data changes (new data fetch)
  useEffect(() => {
    selectedBatchesRef.current = [];
  }, [lagData]);

  const stableDataPointClick = useCallback((timestamp: number, batches: LagResultDto[]) => {
    // Store the batches that were actually grouped together in the graph
    selectedBatchesRef.current = batches;
    
    // Create URL update using refs to avoid dependency on changing searchParams
    const currentParams = parseTimeParams(searchParamsRef.current);
    const newParams = {
      from: currentParams.from,
      to: currentParams.to,
      preset: currentParams.preset,
      selectedTimestamp: timestamp.toString(),
      selectedBatch: undefined,
    };
    
    const urlString = createTimeUrl(newParams);
    setSearchParamsRef.current(urlString);
    setHighlightTrigger(prev => prev + 1);
  }, []); // No dependencies - truly stable

  const graphProps = useMemo(() => ({
    data: lagData,
    loading,
    error,
    fromDate,
    toDate,
    onDataPointClick: stableDataPointClick
  }), [lagData, loading, error, fromDate, toDate, stableDataPointClick]);

  return (
    <Paper sx={{ p: 3 }}>
      <DateController
        fromDate={fromDate}
        toDate={toDate}
        initialPreset={urlParams.preset || null}
        onDateChange={handleDateChange}
        onPresetChange={handlePresetChange}
        onPresetRefresh={handlePresetRefresh}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {error && (
        <Box sx={{ color: 'error.main', mt: 2 }}>
          Error: {error}
        </Box>
      )}

      <Box sx={{ mt: 3, minHeight: 400, mb: 3 }}>
        <Graph {...graphProps} />
      </Box>
      
      {selectedData && (
        <Box sx={{ mt: 3 }}>
          <DetailView 
            selectedData={selectedData} 
            highlightTrigger={highlightTrigger} 
            onBatchClick={handleBatchClick}
            onClose={handleCloseDetailView}
          />
        </Box>
      )}
      
      {selectedBatch && (
        <Box sx={{ mt: 3 }}>
          <BatchBreakdown 
            batch={selectedBatch}
            highlightTrigger={batchHighlightTrigger}
            onClose={handleCloseBatchBreakdown}
          />
        </Box>
      )}
    </Paper>
  );
};

function formatDateForUrl(date: Date): string {
  return date.toISOString();
}
