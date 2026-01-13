export const timePresets = ["5m", "1h", "24h", "7d"] as const;
export type TimePreset = (typeof timePresets)[number];

export interface TimeParams {
  from?: string;
  to?: string;
  preset?: TimePreset;
  selectedBucket?: { start: Date; end: Date };
  selectedBatch?: string;
}

export const parseTimeParams = (searchParams: URLSearchParams): TimeParams => {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const preset = searchParams.get("preset");
  const bucketFrom = searchParams.get("bucketFrom");
  const bucketTo = searchParams.get("bucketTo");
  const selectedBatch = searchParams.get("batch");
  const presetIndex = preset ? timePresets.indexOf(preset as TimePreset) : -1;

  return {
    from: from || undefined,
    to: to || undefined,
    preset: presetIndex !== -1 ? timePresets[presetIndex] : undefined,
    selectedBucket:
      bucketFrom && bucketTo
        ? { start: new Date(bucketFrom), end: new Date(bucketTo) }
        : undefined,
    selectedBatch: selectedBatch || undefined,
  };
};

export const getDateRangeFromParams = (
  params: TimeParams,
): { from: Date; to: Date } | undefined => {
  // If manual dates are specified, use them
  if (params.from && params.to) {
    return {
      from: new Date(params.from),
      to: new Date(params.to),
    };
  }
};

export const createTimeUrl = (
  searchParams: URLSearchParams,
  params: Partial<{
    from: Date;
    to: Date;
    preset: TimePreset | null;
    bucketStart: Date | null;
    bucketEnd: Date | null;
    selectedBatch: string | null;
  }>,
): URLSearchParams => {
  const newParams = new URLSearchParams(searchParams);

  if (params.preset) {
    newParams.set("preset", params.preset);
    newParams.delete("from");
    newParams.delete("to");
  } else {
    newParams.delete("preset");

    if (params.from) {
      newParams.set("from", formatDateForUrl(params.from));
    }

    if (params.to) {
      newParams.set("to", formatDateForUrl(params.to));
    }
  }

  if (params.bucketStart && params.bucketEnd) {
    newParams.set("bucketFrom", params.bucketStart.toISOString());
    newParams.set("bucketTo", params.bucketEnd.toISOString());
  } else {
    newParams.delete("bucketFrom");
    newParams.delete("bucketTo");
  }

  if (params.selectedBatch) {
    newParams.set("batch", params.selectedBatch);
  } else {
    newParams.delete("batch");
  }

  return newParams;
};
export const formatDateForUrl = (date: Date): string => {
  return date.toISOString();
};
