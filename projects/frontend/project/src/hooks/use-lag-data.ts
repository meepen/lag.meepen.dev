import { useState, useCallback } from "react";
import { apiService } from "../services/api";
import { downsampleedToLagResultDtos } from "../utils/graphUtils";
import type { LagResultDto } from "@lag.meepen.dev/api-schema";

export function useLagData() {
  const [lagData, setLagData] = useState<
    (LagResultDto & { bucketStart: Date; bucketEnd: Date })[]
  >([]);
  const [detailBatches, setDetailBatches] = useState<LagResultDto[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getLagDownsample(
        from.toISOString(),
        to.toISOString(),
      );
      const transformed = downsampleedToLagResultDtos(response);
      setLagData(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(
    async (bucketStart: Date, bucketEnd: Date) => {
      setDetailLoading(true);
      try {
        const response = await apiService.getLagData(
          bucketStart.toISOString(),
          bucketEnd.toISOString(),
        );
        setDetailBatches(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch details",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  return {
    lagData,
    detailBatches,
    loading,
    error,
    detailLoading,
    fetchData,
    fetchDetails,
  };
}
