/** Prediction market data sources */
export type MarketSource = 'polymarket' | 'kalshi' | 'gemini';

/** Market status */
export type MarketStatus = 'open' | 'closed' | 'settled';

/** Market category */
export type MarketCategory =
  | 'politics'
  | 'sports'
  | 'finance'
  | 'entertainment'
  | 'science'
  | 'other';

/**
 * An outcome within a prediction market.
 */
export interface Outcome {
  /** Outcome name (e.g. "Yes", "No", "Donald Trump") */
  name: string;
  /** Probability as a decimal between 0 and 1 */
  probability: number;
  /** 24-hour trading volume (null if unavailable) */
  volume24h: number | null;
}

/**
 * A normalized prediction market from any supported platform.
 */
export interface Market {
  /** Unique market ID (prefixed: pm_, ks_, gm_) */
  id: string;
  /** Source platform */
  source: MarketSource;
  /** Original ID on the source platform */
  sourceId: string;
  /** The market question */
  question: string;
  /** Market description (may be null) */
  description: string | null;
  /** Normalized category */
  category: MarketCategory;
  /** Market status */
  status: MarketStatus;
  /** Available outcomes with probabilities */
  outcomes: Outcome[];
  /** Expected resolution date (ISO 8601, may be null) */
  resolutionDate: string | null;
  /** When the market was created (ISO 8601) */
  createdAt: string;
  /** When the market was last updated (ISO 8601) */
  updatedAt: string;
  /** URL to the market on its source platform */
  url: string;
  /** Market image URL (may be null) */
  imageUrl: string | null;
  /** Tags from the source platform */
  tags: string[];
}

/**
 * Parameters for listing markets.
 */
export interface MarketListParams {
  /** Filter by source platform */
  source?: MarketSource | 'all';
  /** Filter by category */
  category?: MarketCategory;
  /** Filter by status */
  status?: MarketStatus;
  /** Search query string */
  q?: string;
  /** Maximum results per page (default: 50, max: 200) */
  limit?: number;
  /** Offset for pagination (default: 0) */
  offset?: number;
}
