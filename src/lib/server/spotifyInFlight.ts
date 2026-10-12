export interface InFlightResult {
  status: number;
  statusText?: string;
  body: any;
  isJson: boolean;
  isNoContent: boolean;
  headers: Record<string, string>;
}

// In-memory map to coalesce concurrent identical GET requests by cache key
// Shared across server paths so proxy and spotifyAuthUser never double-fetch or double-count.
export const inFlightGetRequests = new Map<string, Promise<InFlightResult>>();
