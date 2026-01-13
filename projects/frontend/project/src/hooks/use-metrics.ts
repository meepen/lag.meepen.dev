import { useState, useCallback, useMemo } from "react";
import { metricLabel } from "../utils/graphUtils";

export function useMetrics() {
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

  return {
    selectedMetrics,
    metricsMenuAnchor,
    openMetricsMenu,
    closeMetricsMenu,
    toggleMetric,
    metricsOptions,
  };
}
