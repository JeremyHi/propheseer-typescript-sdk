/**
 * Rate limit information extracted from API response headers.
 */
export interface RateLimitInfo {
  /** User's plan (free, pro, business, etc.) */
  plan: string;
  /** Billing type: 'subscription' or 'credits' */
  billingType: 'subscription' | 'credits';
  /** Daily request limit (subscription billing) */
  limitDay?: number;
  /** Remaining daily requests (subscription billing) */
  remainingDay?: number;
  /** Per-minute request limit (subscription billing) */
  limitMinute?: number;
  /** Remaining per-minute requests (subscription billing) */
  remainingMinute?: number;
  /** Credit balance in cents (credit billing) */
  creditBalanceCents?: number;
  /** Formatted credit balance (credit billing) */
  creditBalance?: string;
  /** Cost of the request in cents (credit billing) */
  requestCostCents?: number;
  /** Formatted request cost (credit billing) */
  requestCost?: string;
}

/**
 * Wrapper for API responses that includes rate limit info.
 */
export interface APIResponse<T> {
  /** The response data */
  data: T;
  /** Rate limit information from response headers */
  rateLimit: RateLimitInfo | null;
  /** The raw Response object */
  response: Response;
}

/**
 * Pagination metadata returned by paginated endpoints.
 */
export interface PaginationMeta {
  /** Total number of items matching the query */
  total: number;
  /** Maximum items per page */
  limit: number;
  /** Current offset */
  offset: number;
  /** Source metadata (varies by endpoint) */
  sources?: Record<string, unknown>;
}
