import type { LagResultDto } from "@lag.meepen.dev/api-schema";

export interface LagControllerState {
  lagData: (LagResultDto & { bucketStart: Date; bucketEnd: Date })[];
  detailBatches: LagResultDto[] | null;
  loading: boolean;
  error: string | null;
  highlightTrigger: number;
  batchHighlightTrigger: number;
  detailLoading: boolean;
  selectedMetrics: string[];
  metricsMenuAnchor: null | HTMLElement;
  stableDateRange: { from: Date; to: Date };
  selectedTimestamp: number | null;
  selectedBatchId: string | null;
}

export const initialState: LagControllerState = {
  lagData: [],
  detailBatches: null,
  loading: false,
  error: null,
  highlightTrigger: 0,
  batchHighlightTrigger: 0,
  detailLoading: false,
  selectedMetrics: ["p95", "min", "avg"],
  metricsMenuAnchor: null,
  stableDateRange: { from: new Date(), to: new Date() },
  selectedTimestamp: null,
  selectedBatchId: null,
};

export type LagControllerAction =
  | { type: "SET_LAG_DATA"; payload: LagControllerState["lagData"] }
  | { type: "SET_DETAIL_BATCHES"; payload: LagControllerState["detailBatches"] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_HIGHLIGHT_TRIGGER" }
  | { type: "SET_BATCH_HIGHLIGHT_TRIGGER" }
  | { type: "SET_DETAIL_LOADING"; payload: boolean }
  | { type: "SET_SELECTED_METRICS"; payload: string[] }
  | { type: "SET_METRICS_MENU_ANCHOR"; payload: null | HTMLElement }
  | { type: "SET_STABLE_DATE_RANGE"; payload: { from: Date; to: Date } }
  | { type: "SET_SELECTED_TIMESTAMP"; payload: number | null }
  | { type: "SET_SELECTED_BATCH_ID"; payload: string | null };

export function lagControllerReducer(
  state: LagControllerState,
  action: LagControllerAction,
): LagControllerState {
  switch (action.type) {
    case "SET_LAG_DATA":
      return { ...state, lagData: action.payload };
    case "SET_DETAIL_BATCHES":
      return { ...state, detailBatches: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_HIGHLIGHT_TRIGGER":
      return { ...state, highlightTrigger: state.highlightTrigger + 1 };
    case "SET_BATCH_HIGHLIGHT_TRIGGER":
      return {
        ...state,
        batchHighlightTrigger: state.batchHighlightTrigger + 1,
      };
    case "SET_DETAIL_LOADING":
      return { ...state, detailLoading: action.payload };
    case "SET_SELECTED_METRICS":
      return { ...state, selectedMetrics: action.payload };
    case "SET_METRICS_MENU_ANCHOR":
      return { ...state, metricsMenuAnchor: action.payload };
    case "SET_STABLE_DATE_RANGE":
      return { ...state, stableDateRange: action.payload };
    case "SET_SELECTED_TIMESTAMP":
      return { ...state, selectedTimestamp: action.payload };
    case "SET_SELECTED_BATCH_ID":
      return { ...state, selectedBatchId: action.payload };
    default:
      return state;
  }
}
