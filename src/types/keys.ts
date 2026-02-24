/**
 * API key usage statistics.
 */
export interface KeyUsage {
  /** Requests made today */
  daily: number;
  /** Requests made this minute */
  minute: number;
  /** Total requests ever */
  total: number;
}

/**
 * Daily usage history entry.
 */
export interface UsageHistoryEntry {
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Number of requests */
  count: number;
}

/**
 * Plan rate limits.
 */
export interface PlanLimits {
  /** Maximum requests per day */
  requestsPerDay: number;
  /** Maximum requests per minute */
  requestsPerMinute: number;
}

/**
 * Information about the current API key.
 */
export interface KeyInfo {
  /** Key ID */
  id: string;
  /** Key name */
  name: string;
  /** Plan name */
  plan: string;
  /** Rate limits for the plan */
  limits: PlanLimits;
  /** Current usage */
  usage: KeyUsage;
  /** Daily usage history */
  history: UsageHistoryEntry[];
  /** When the key was created (ISO 8601) */
  createdAt: string;
  /** When the key was last used (ISO 8601, may be null) */
  lastUsedAt: string | null;
}
