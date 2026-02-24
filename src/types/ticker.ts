import type { MarketSource } from './markets.js';

/**
 * A simplified market item for the ticker.
 */
export interface TickerItem {
  /** Market ID */
  id: string;
  /** Market question */
  question: string;
  /** Primary outcome probability */
  probability: number;
  /** Source platform */
  source: MarketSource;
}

/**
 * Parameters for listing ticker items.
 */
export interface TickerListParams {
  /** Maximum items (default: 12, max: 20) */
  limit?: number;
}
