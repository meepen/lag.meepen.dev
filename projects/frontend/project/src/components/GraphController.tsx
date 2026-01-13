import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Box, Paper } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { DateController } from "./DateController";
import { Graph } from "./Graph";
import { DetailView } from "./DetailView";
import { BatchBreakdown } from "./BatchBreakdown";
import { apiService } from "../services/api";
import { createTimeUrl, parseTimeParams } from "../utils/urlParams";
import type { TimePreset } from "../utils/urlParams";
import { downsampleedToLagResultDtos, metricLabel } from "../utils/graphUtils";
import type { LagResultDto } from "@lag.meepen.dev/api-schema";

export function GraphController(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  // Aggregated (downsampled) data augmented with bucket range
  const [lagData, setLagData] = useState<
    (LagResultDto & { bucketStart: Date; bucketEnd: Date })[]
  >([]);
  // Detailed data fetched from lag endpoint for a selected bucket
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const [preset, setPreset] = useState<TimePreset | null>(null);

  // Handle bucket detail view state
  const [selectedBucket, setSelectedBucket] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [bucketDetails, setBucketDetails] = useState<LagResultDto[] | null>(
    null,
  );
  useEffect(() => {
    if (!selectedBucket) {
      return;
    }

    apiService
      .getLagData(
        selectedBucket.start.toISOString(),
        selectedBucket.end.toISOString(),
      )
      .then((detailed) => {
        setBucketDetails(detailed);
      })
      .catch((err: unknown) => {
        console.error("GraphController: Error fetching bucket details", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch bucket data",
        );
      });
  }, [selectedBucket]);

  // Handle selected batch state
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const handleBatchClick = useCallback(
    (batchId: string) => {
      setSelectedBatchId(batchId);
    },
    [setSelectedBatchId],
  );

  const [selectedBatch, setSelectedBatch] = useState<LagResultDto | null>(null);
  useEffect(() => {
    if (!selectedBatchId || !bucketDetails) {
      return;
    }

    const batch =
      bucketDetails.find((b) => b.batchId === selectedBatchId) || null;
    if (batch === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBatch(null);
      setSelectedBatchId(null);
      return;
    }

    setSelectedBatch(batch);
  }, [selectedBatchId, bucketDetails]);

  useEffect(() => {
    // update all parameters now
    const params = parseTimeParams(searchParams);
    if (params.preset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreset(params.preset);
    }
    if (params.from) {
      setFromDate(new Date(params.from));
    }
    if (params.to) {
      setToDate(new Date(params.to));
    }
    if (params.preset) {
      setPreset(params.preset);
    }
    if (params.selectedBucket) {
      setSelectedBucket(params.selectedBucket);
    }
    if (params.selectedBatch) {
      setSelectedBatchId(params.selectedBatch);
    }
  }, []);

  // Handle URL param changes
  useEffect(() => {
    const params = {
      preset: preset ?? undefined,
      from: preset ? undefined : (fromDate ?? undefined),
      to: preset ? undefined : (toDate ?? undefined),
      bucketStart: selectedBucket?.start ?? undefined,
      bucketEnd: selectedBucket?.end ?? undefined,
      selectedBatch: selectedBatchId ?? undefined,
    };
    console.debug("GraphController: URL params changed, updating state", {
      params,
    });
    setSearchParams(createTimeUrl(searchParams, params));
  }, [
    preset,
    fromDate,
    toDate,
    selectedBucket,
    selectedBatchId,
    searchParams,
    setSearchParams,
  ]);

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

  // Data fetching
  useEffect(() => {
    console.debug("GraphController: Fetching data", {
      preset,
      fromDate,
      toDate,
    });
    if (!fromDate || !toDate) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    apiService
      .getLagDownsample(fromDate.toISOString(), toDate.toISOString())
      .then((downsampled) => {
        const transformed: (LagResultDto & {
          bucketStart: Date;
          bucketEnd: Date;
        })[] = downsampleedToLagResultDtos(downsampled);
        setLagData(transformed);
      })
      .catch((err: unknown) => {
        console.error("GraphController: Error fetching data", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLagData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [preset, fromDate, toDate]);

  const handleCloseBatchBreakdown = useCallback(() => {
    setSelectedBatch(null);
    setSelectedBatchId(null);
  }, [setSelectedBatch, setSelectedBatchId]);

  const handleCloseDetailView = useCallback(() => {
    setBucketDetails(null);
    setSelectedBucket(null);
    handleCloseBatchBreakdown();
  }, [setBucketDetails, setSelectedBucket, handleCloseBatchBreakdown]);

  // Create stable graph props that only change when the actual data changes
  // Use a stable callback with ref to avoid recreating on every URL change

  const onDataPointClick = useCallback(
    (timestamp: number, bucketStart: Date, bucketEnd: Date) => {
      setSelectedBucket({ start: bucketStart, end: bucketEnd });
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
      onDataPointClick,
      selectedMetrics,
      metricsMenuAnchor,
      onOpenMetricsMenu: openMetricsMenu,
      onCloseMetricsMenu: closeMetricsMenu,
      metricsOptions,
    }),
    [
      lagData,
      loading,
      error,
      fromDate,
      toDate,
      onDataPointClick,
      selectedMetrics,
      metricsMenuAnchor,
      openMetricsMenu,
      closeMetricsMenu,
      metricsOptions,
    ],
  );

  return (
    <Paper sx={{ p: 3 }}>
      <DateController
        loading={loading}
        setFromDate={setFromDate}
        setToDate={setToDate}
        preset={preset}
        setPreset={setPreset}
        toDate={toDate}
        fromDate={fromDate}
      />
      {error && <Box sx={{ color: "error.main", mt: 2 }}>Error: {error}</Box>}
      <Box sx={{ minHeight: 400, mt: 3, mb: 3 }}>
        <Graph {...graphProps} />
      </Box>

      {selectedBucket && (
        <Box sx={{ mt: 3 }}>
          <DetailView
            bucketInfo={selectedBucket}
            selectedData={bucketDetails}
            onBatchClick={handleBatchClick}
            onClose={handleCloseDetailView}
          />
        </Box>
      )}

      {selectedBatchId && (
        <Box sx={{ mt: 3 }}>
          <BatchBreakdown
            batch={selectedBatch}
            selectedBatchId={selectedBatchId}
            onClose={handleCloseBatchBreakdown}
          />
        </Box>
      )}
    </Paper>
  );
}
