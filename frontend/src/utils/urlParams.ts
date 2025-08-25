export type TimePreset = '5m' | '1h' | '24h' | '7d';

export interface TimeParams {
  from?: string;
  to?: string;
  preset?: TimePreset;
  selectedTimestamp?: string;
  selectedBatch?: string;
}

export const parseTimeParams = (searchParams: URLSearchParams): TimeParams => {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const preset = searchParams.get('preset') as TimePreset;
  const selectedTimestamp = searchParams.get('selected');
  const selectedBatch = searchParams.get('batch');

  return {
    from: from || undefined,
    to: to || undefined,
    preset: preset || undefined,
    selectedTimestamp: selectedTimestamp || undefined,
    selectedBatch: selectedBatch || undefined,
  };
};

export const createTimeUrl = (params: TimeParams): string => {
  const searchParams = new URLSearchParams();
  
  if (params.preset) {
    searchParams.set('preset', params.preset);
  } else if (params.from && params.to) {
    searchParams.set('from', params.from);
    searchParams.set('to', params.to);
  }
  
  if (params.selectedTimestamp) {
    searchParams.set('selected', params.selectedTimestamp);
  }
  
  if (params.selectedBatch) {
    searchParams.set('batch', params.selectedBatch);
  }
  
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

export const getDateRangeFromParams = (params: TimeParams): { from: Date; to: Date } => {
  const now = new Date();
  
  // If preset is specified, calculate dates from preset
  if (params.preset) {
    // Calculate the last ended minute (current time rounded down to the previous full minute)
    const lastEndedMinute = new Date(now);
    lastEndedMinute.setSeconds(0, 0); // Reset seconds and milliseconds to 0
    
    let duration: number;
    switch (params.preset) {
      case '5m':
        duration = 5 * 60 * 1000;
        break;
      case '1h':
        duration = 60 * 60 * 1000;
        break;
      case '24h':
        duration = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        duration = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        duration = 5 * 60 * 1000; // Default to 5 minutes
    }
    return {
      from: new Date(lastEndedMinute.getTime() - duration),
      to: lastEndedMinute,
    };
  }
  
  // If manual dates are specified, use them
  if (params.from && params.to) {
    return {
      from: new Date(params.from),
      to: new Date(params.to),
    };
  }
  
  // Default fallback
  return {
    from: new Date(now.getTime() - 5 * 60 * 1000),
    to: now,
  };
};

export const formatDateForUrl = (date: Date): string => {
  return date.toISOString();
};
