import React from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LagResultDto } from "../types/lag-result.dto";
import type { CategoricalChartFunc } from "recharts/types/chart/types";

interface GraphProps {
  data: (LagResultDto & { bucketStart: Date; bucketEnd: Date })[];
  loading: boolean;
  error: string | null;
  fromDate: Date;
  toDate: Date;
  onDataPointClick?: (
    timestamp: number,
    bucketStart: Date,
    bucketEnd: Date,
  ) => void;
  selectedMetrics: string[]; // ['p95','p99','max','avg','min'] subset
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  averageLatency: number | null;
  minLatency: number | null;
  maxLatency: number | null;
  p95Latency: number | null;
  p99Latency: number | null;
  testCount: number;
  bucketStart: Date;
  bucketEnd: Date;
  batches: LagResultDto[];
  empty: boolean;
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

export const Graph: React.FC<GraphProps> = React.memo(
  ({ data, loading, error, onDataPointClick, selectedMetrics }) => {
    // Convert aggregated buckets (each LagResultDto is already a bucket) into chart points.
    const processAggregatedData = (
      buckets: (LagResultDto & { bucketStart: Date; bucketEnd: Date })[],
    ): ChartDataPoint[] => {
      return buckets
        .map((b) => {
          const timestamp = b.bucketStart.getTime();
          if (b.results.length === 0) {
            return {
              time: new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp,
              averageLatency: null,
              minLatency: null,
              maxLatency: null,
              p95Latency: null,
              p99Latency: null,
              testCount: b.testCount,
              bucketStart: b.bucketStart,
              bucketEnd: b.bucketEnd,
              batches: [b],
              empty: true,
            };
          }
          const lastHop = b.results[b.results.length - 1];
          const avg = Number(lastHop.averageMs.toFixed(2));
          const min = Number(lastHop.bestMs.toFixed(2));
          const max = Number(lastHop.worstMs.toFixed(2));
          const p95 = Number(lastHop.p95Ms.toFixed(2));
          const p99 = Number(lastHop.p99Ms.toFixed(2));
          return {
            time: new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestamp,
            averageLatency: avg,
            minLatency: min,
            maxLatency: max,
            p95Latency: p95,
            p99Latency: p99,
            testCount: b.testCount,
            bucketStart: b.bucketStart,
            bucketEnd: b.bucketEnd,
            batches: [b],
            empty: false,
          };
        })
        .sort((a, b2) => a.timestamp - b2.timestamp);
    };

    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading lag data...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (data.length === 0) {
      return (
        <Alert severity="info">
          No data available for the selected time range.
        </Alert>
      );
    }

    const chartData = processAggregatedData(data);

    // No log scaling: linear domain will be derived automatically by Recharts.

    // Handle chart click events
    const handleChartClick: CategoricalChartFunc = (event) => {
      let clickedPoint: ChartDataPoint | null = null;
      if (event.activeLabel) {
        clickedPoint =
          chartData.find((point) => point.time === event.activeLabel) || null;
      }
      if (clickedPoint) {
        onDataPointClick?.(
          clickedPoint.timestamp,
          clickedPoint.bucketStart,
          clickedPoint.bucketEnd,
        );
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
    const totalBuckets = data.length;
    const totalTests = data.reduce((sum, batch) => sum + batch.testCount, 0);
    const latencyPoints = chartData.filter((p) => p.averageLatency !== null);
    const overallAvgLatency = latencyPoints.length
      ? latencyPoints.reduce(
          (sum, point) => sum + (point.averageLatency ?? 0),
          0,
        ) / latencyPoints.length
      : 0;

    const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <Box
            sx={{
              backgroundColor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
              boxShadow: 2,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Time: {label}
            </Typography>
            {data.empty ? (
              <Typography variant="body2" color="text.disabled">
                No data in bucket
              </Typography>
            ) : (
              <>
                {selectedMetrics.includes("avg") && (
                  <Typography variant="body2" color="primary">
                    Avg: {data.averageLatency}ms
                  </Typography>
                )}
                {selectedMetrics.includes("min") && (
                  <Typography variant="body2" color="success.main">
                    Min: {data.minLatency}ms
                  </Typography>
                )}
                {selectedMetrics.includes("max") && (
                  <Typography variant="body2" color="error.main">
                    Max: {data.maxLatency}ms
                  </Typography>
                )}
                {selectedMetrics.includes("p95") &&
                  data.p95Latency !== null && (
                    <Typography variant="body2" color="warning.main">
                      p95: {data.p95Latency}ms
                    </Typography>
                  )}
                {selectedMetrics.includes("p99") &&
                  data.p99Latency !== null && (
                    <Typography variant="body2" color="warning.dark">
                      p99: {data.p99Latency}ms
                    </Typography>
                  )}
              </>
            )}
            <Typography variant="body2" color="text.secondary">
              Tests: {data.testCount}
            </Typography>
          </Box>
        );
      }
      return null;
    };

    return (
      <Box>
        {/* Summary Cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Card sx={{ minWidth: 120 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4" color="primary">
                {totalBuckets}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Buckets
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 120 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4" color="primary">
                {overallAvgLatency.toFixed(1)}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Latency
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 120 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4" color="primary">
                {chartData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data Points
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 120 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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
                domain={[0, "auto"]}
                label={{
                  value: "Latency (ms)",
                  angle: -90,
                  position: "insideLeft",
                }}
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => {
                  if (v >= 1000) {
                    return `${(v / 1000).toFixed(1)}s`;
                  }
                  return `${v.toFixed(0)}ms`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.includes("avg") && (
                <Line
                  type="monotone"
                  dataKey="averageLatency"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Average"
                  connectNulls={false}
                />
              )}
              {selectedMetrics.includes("min") && (
                <Line
                  type="monotone"
                  dataKey="minLatency"
                  stroke="#4caf50"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                  name="Min"
                  connectNulls={false}
                />
              )}
              {selectedMetrics.includes("max") && (
                <Line
                  type="monotone"
                  dataKey="maxLatency"
                  stroke="#f44336"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                  name="Max"
                  connectNulls={false}
                />
              )}
              {selectedMetrics.includes("p95") && (
                <Line
                  type="monotone"
                  dataKey="p95Latency"
                  stroke="#ff9800"
                  strokeWidth={1.5}
                  dot={false}
                  name="p95"
                  connectNulls={false}
                />
              )}
              {selectedMetrics.includes("p99") && (
                <Line
                  type="monotone"
                  dataKey="p99Latency"
                  stroke="#9c27b0"
                  strokeWidth={1.5}
                  dot={false}
                  name="p99"
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Box>
    );
  },
);
