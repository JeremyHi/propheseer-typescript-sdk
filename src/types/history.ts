import type { MarketSource, MarketCategory } from './markets.js';

/**
 * A historical market snapshot.
 */
export interface MarketHistoryEntry {
  /** Market ID */
  marketId: string;
  /** Snapshot date (YYYY-MM-DD) */
  snapshotDate: string;
  /** Snapshot data (market state at that time) */
  [key: string]: unknown;
}

/**
 * Parameters for listing market history.
 */
export interface HistoryListParams {
  /** Filter by specific market ID */
  marketId?: string;
  /** Filter by source platform */
  source?: MarketSource;
  /** Filter by category */
  category?: MarketCategory;
  /** Number of days of history (default: 30) */
  days?: number;
  /** Maximum results (default: 1000) */
  limit?: number;
}

/**
 * A date with available snapshot data.
 */
export interface SnapshotDate {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Number of markets captured */
  count: number;
}
