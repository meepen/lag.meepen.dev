import { useMemo, useCallback } from "react";
import type { TimePreset } from "../utils/urlParams";
import { parseTimeParams, createTimeUrl } from "../utils/urlParams";
import type { LagResultDto } from "../types/lag-result.dto";

export function useUrlSync(
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams) => void,
  lagData: (LagResultDto & { bucketStart: Date; bucketEnd: Date })[],
  detailBatches: LagResultDto[] | null,
) {
  const urlParams = useMemo(
    () => parseTimeParams(searchParams),
    [searchParams],
  );

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
      const newParams = createTimeUrl(searchParams, params);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const validateSelections = useCallback(() => {
    // Validate selected parameters against loaded data and clear if invalid
    const selectedTimestamp = urlParams.selectedTimestamp
      ? parseInt(urlParams.selectedTimestamp, 10)
      : null;
    const selectedBatchId = urlParams.selectedBatch;

    if (selectedTimestamp && lagData.length > 0) {
      const found = lagData.find(
        (d) => d.bucketStart.getTime() === selectedTimestamp,
      );
      if (!found) {
        updateUrl({ selectedTimestamp: null, selectedBatch: null });
      }
    }

    if (selectedBatchId && detailBatches) {
      const found = detailBatches.find((b) => b.batchId === selectedBatchId);
      if (!found) {
        updateUrl({ selectedBatch: null });
      }
    }
  }, [urlParams, lagData, detailBatches, updateUrl]);

  return {
    urlParams,
    updateUrl,
    validateSelections,
  };
}
