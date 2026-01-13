import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Paper,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { DateController } from "./DateController";
import { Graph } from "./Graph";
import { DetailView } from "./DetailView";
import { BatchBreakdown } from "./BatchBreakdown";
import { apiService } from "../services/api";
import {
  parseTimeParams,
  getDateRangeFromParams,
  createTimeUrl,
} from "../utils/urlParams";
import type { TimePreset } from "../utils/urlParams";
import { downsampleedToLagResultDtos, metricLabel } from "../utils/graphUtils";
import type { LagResultDto } from "@lag.meepen.dev/api-schema";

export const GraphController: React.FC = React.memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Aggregated (downsampled) data augmented with bucket range
  const [lagData, setLagData] = useState<
    (LagResultDto & { bucketStart: Date; bucketEnd: Date })[]
  >([]);
  // Detailed data fetched from lag endpoint for a selected bucket
  const [detailBatches, setDetailBatches] = useState<LagResultDto[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [batchHighlightTrigger, setBatchHighlightTrigger] = useState(0);
  // Separate loading state for detailed fetches so the graph doesn't flicker
  const [detailLoading, setDetailLoading] = useState(false);
  // Metric selection state (default: p95, min, avg)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "p95",
    "min",
    "avg",
  ]);
  const [metricsMenuAnchor, setMetricsMenuAnchor] =
    useState<null | HTMLElement>(null);

  const openMetricsMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setMetricsMenuAnchor(e.currentTarget);
    },
    [],
  );
  const closeMetricsMenu = useCallback(() => {
    setMetricsMenuAnchor(null);
  }, []);
  const toggleMetric = useCallback((metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  }, []);

  const metricsOptions = useMemo(
    () =>
      ["p95", "p99", "max", "avg", "min"].map((m) => ({
        key: m,
        label: metricLabel(m),
        checked: selectedMetrics.includes(m),
        onChange: () => {
          toggleMetric(m);
        },
      })),
    [selectedMetrics, toggleMetric],
  );

  // Refs for stable callbacks and storing selected batches
  const searchParamsRef = useRef(searchParams);
  const setSearchParamsRef = useRef(setSearchParams);
  // Removed selectedBatchesRef pattern; now we explicitly fetch detail data

  // Parse current URL parameters - single source of truth
  const urlParams = useMemo(
    () => parseTimeParams(searchParams),
    [searchParams],
  );

  // Store stable date range - only update when explicitly changed
  const [stableDateRange, setStableDateRange] = useState(() => {
    return getDateRangeFromParams(urlParams);
  });

  // Update stable dates only when URL parameters change in a way that should trigger data fetch
  const lastUrlKey = useRef("");
  useEffect(() => {
    const currentUrlKey = `${urlParams.from}-${urlParams.to}-${urlParams.preset}`;
    if (currentUrlKey !== lastUrlKey.current) {
      lastUrlKey.current = currentUrlKey;
      setStableDateRange(getDateRangeFromParams(urlParams));
    }
  }, [urlParams]);

  const fromDate = stableDateRange.from;
  const toDate = stableDateRange.to;

  const selectedTimestamp = urlParams.selectedTimestamp
    ? parseInt(urlParams.selectedTimestamp, 10)
    : null;
  const selectedBatchId = urlParams.selectedBatch;

  // Memoize selectedData computation to use the exact batches from graph click
  const selectedData = useMemo(() => {
    if (!selectedTimestamp || !detailBatches) {
      return null;
    }
    return { timestamp: selectedTimestamp, batches: detailBatches };
  }, [selectedTimestamp, detailBatches]);

  // Memoize selectedBatch computation
  const selectedBatch = useMemo(() => {
    if (!selectedBatchId || !detailBatches) {
      return null;
    }
    return detailBatches.find((b) => b.batchId === selectedBatchId) || null;
  }, [selectedBatchId, detailBatches]);

  // Simple URL update function
  const updateUrl = useCallback(
    (
      params: Partial<{
        from: Date;
        to: Date;
        preset: TimePreset | null;
        selectedTimestamp: number | null;
        selectedBatch: string | null;
      }>,
    ) => {
      const urlString = createTimeUrl(searchParams, params);
      setSearchParams(urlString);
    },
    [searchParams, setSearchParams],
  );

  // Data fetching
  const fetchData = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);

    try {
      const downsampled = await apiService.getLagDownsample(
        from.toISOString(),
        to.toISOString(),
      );
      const transformed: (LagResultDto & {
        bucketStart: Date;
        bucketEnd: Date;
      })[] = downsampleedToLagResultDtos(downsampled);
      setLagData(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setLagData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Event handlers

  // Fetch data when date range changes
  const lastFetchedDates = useRef({ from: "", to: "" });

  useEffect(() => {
    const fromStr = fromDate.toISOString();
    const toStr = toDate.toISOString();

    // Only fetch if dates actually changed
    if (
      lastFetchedDates.current.from !== fromStr ||
      lastFetchedDates.current.to !== toStr
    ) {
      lastFetchedDates.current = { from: fromStr, to: toStr };
      fetchData(fromDate, toDate).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      });
    }
  }, [fromDate, toDate]); // fetchData is stable with empty deps

  // Validate selected parameters against loaded data and clear if invalid
  useEffect(() => {
    // Only attempt validation once we actually have downsampled data
    if (lagData.length === 0) {
      return;
    }

    let shouldUpdateUrl = false;
    const urlUpdates: Partial<{
      selectedTimestamp: number | null;
      selectedBatch: string | null;
    }> = {};

    // Validate selected timestamp (must be near at least one downsampled batch)
    if (selectedTimestamp) {
      const hasValidTimestamp = lagData.some((batch) => {
        const batchTime = new Date(batch.createdAt).getTime();
        return Math.abs(batchTime - selectedTimestamp) <= 30000; // 30s tolerance
      });
      if (!hasValidTimestamp) {
        urlUpdates.selectedTimestamp = null;
        urlUpdates.selectedBatch = null; // Clear batch if timestamp invalid
        shouldUpdateUrl = true;
      }
    }

    // Validate selected batch: must exist either in detailBatches (actual batch IDs) OR in lagData
    // We intentionally do NOT clear while detailBatches are still loading (null)
    if (selectedBatchId && !urlUpdates.selectedBatch) {
      const hasValidBatchInDetails = detailBatches
        ? detailBatches.some((b) => b.batchId === selectedBatchId)
        : true; // optimistic until details fetched
      const hasValidBatchInLagData = lagData.some(
        (batch) => batch.batchId === selectedBatchId,
      );
      if (!hasValidBatchInDetails && !hasValidBatchInLagData) {
        urlUpdates.selectedBatch = null;
        shouldUpdateUrl = true;
      }
    }

    if (shouldUpdateUrl) {
      updateUrl(urlUpdates);
    }
  }, [lagData, selectedTimestamp, selectedBatchId, detailBatches, updateUrl]);

  // Event handlers - these only update URL, components react to URL changes
  const handleDateChange = useCallback(
    (from: Date, to: Date) => {
      updateUrl({ from, to, preset: null });
    },
    [updateUrl],
  );

  const handlePresetChange = useCallback(
    (preset: TimePreset) => {
      updateUrl({ preset });
      // Force update of stable dates for new preset
      setStableDateRange(getDateRangeFromParams({ ...urlParams, preset }));
    },
    [updateUrl, urlParams],
  );

  const handleRefresh = useCallback(() => {
    // If we have a preset, recalculate the date range to get fresh "now" time
    if (urlParams.preset) {
      const freshDateRange = getDateRangeFromParams(urlParams);
      setStableDateRange(freshDateRange);
      fetchData(freshDateRange.from, freshDateRange.to).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      });
    } else {
      fetchData(fromDate, toDate).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      });
    }
  }, [urlParams, fetchData, fromDate, toDate]);

  const handlePresetRefresh = useCallback(
    (preset: TimePreset) => {
      // When refreshing a preset, recalculate dates to current time
      const freshParams = { ...urlParams, preset };
      const freshDateRange = getDateRangeFromParams(freshParams);
      setStableDateRange(freshDateRange);
      fetchData(freshDateRange.from, freshDateRange.to).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      });
    },
    [urlParams, fetchData],
  );

  const handleBatchClick = useCallback(
    (batchId: string) => {
      updateUrl({ selectedBatch: batchId });
      setBatchHighlightTrigger((prev) => prev + 1);
    },
    [updateUrl],
  );

  const handleCloseDetailView = useCallback(() => {
    updateUrl({ selectedTimestamp: null, selectedBatch: null });
    setDetailBatches(null);
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

  const stableDataPointClick = useCallback(
    async (timestamp: number, bucketStart: Date, bucketEnd: Date) => {
      // Fetch detailed batches for this bucket range using lag endpoint without toggling main graph loading
      try {
        setDetailLoading(true);
        setError(null);
        const detailed = await apiService.getLagData(
          bucketStart.toISOString(),
          bucketEnd.toISOString(),
        );
        setDetailBatches(detailed);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to fetch detailed lag data",
        );
        setDetailBatches(null);
      } finally {
        setDetailLoading(false);
      }

      // Update URL to reflect selected timestamp (we use bucketStart as the anchor)
      const urlString = createTimeUrl(searchParamsRef.current, {
        selectedTimestamp: timestamp,
        selectedBatch: null,
      });
      setSearchParamsRef.current(urlString);
      setHighlightTrigger((prev) => prev + 1);
    },
    [],
  );

  const graphProps = useMemo(
    () => ({
      data: lagData,
      loading,
      error,
      fromDate,
      toDate,
      onDataPointClick: stableDataPointClick,
      selectedMetrics,
    }),
    [
      lagData,
      loading,
      error,
      fromDate,
      toDate,
      stableDataPointClick,
      selectedMetrics,
    ],
  );

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
      {error && <Box sx={{ color: "error.main", mt: 2 }}>Error: {error}</Box>}
      <Box sx={{ mt: 3, mb: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" size="small" onClick={openMetricsMenu}>
          Metrics
        </Button>
        <Menu
          anchorEl={metricsMenuAnchor}
          open={Boolean(metricsMenuAnchor)}
          onClose={closeMetricsMenu}
        >
          <FormGroup sx={{ px: 2, py: 1 }}>
            {metricsOptions.map((option) => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    size="small"
                    checked={option.checked}
                    onChange={option.onChange}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
          <MenuItem
            onClick={closeMetricsMenu}
            sx={{ justifyContent: "center", fontSize: 12 }}
          >
            Close
          </MenuItem>
        </Menu>
      </Box>
      <Box sx={{ minHeight: 400, mb: 3 }}>
        <Graph {...graphProps} />
      </Box>

      {selectedData && (
        <Box sx={{ mt: 3 }}>
          <DetailView
            selectedData={selectedData}
            highlightTrigger={highlightTrigger}
            onBatchClick={handleBatchClick}
            onClose={handleCloseDetailView}
            detailLoading={detailLoading}
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
});
