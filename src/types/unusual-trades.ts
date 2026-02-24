import type { MarketSource } from './markets.js';

/** Reasons a trade was flagged as unusual */
export type DetectionReason =
  | 'potential_insider'
  | 'high_amount'
  | 'new_wallet'
  | 'near_resolution';

/** Trade side */
export type TradeSide = 'BUY' | 'SELL';

/**
 * Market information associated with an unusual trade.
 */
export interface UnusualTradeMarket {
  /** Market ID */
  id: string;
  /** Market question */
  question: string;
  /** Source platform */
  source: MarketSource;
  /** Market end date (may be undefined) */
  endDate?: string;
  /** URL to the market */
  url?: string;
  /** Tags from the platform */
  tags: string[];
  /** Market image URL */
  imageUrl?: string | null;
}

/**
 * Details of the flagged trade.
 */
export interface TradeDetails {
  /** Trader's wallet address */
  walletAddress: string;
  /** Buy or sell */
  side: TradeSide;
  /** Trade size (contracts) */
  size: number;
  /** Trade price */
  price: number;
  /** USDC value of the trade */
  usdcValue: number;
  /** When the trade occurred (ISO 8601) */
  timestamp: string;
  /** On-chain transaction hash */
  transactionHash: string;
}

/**
 * Why the trade was flagged.
 */
export interface DetectionInfo {
  /** Detection reason */
  reason: DetectionReason;
  /** Anomaly score (0-100) */
  anomalyScore: number;
  /** Market context for the detection */
  context: {
    /** Average trade size in this market */
    marketAvgSize: number;
    /** Standard deviation of trade sizes */
    marketStdDev: number;
  };
}

/**
 * An unusual trade detected by the system.
 */
export interface UnusualTrade {
  /** Trade ID */
  id: string;
  /** Associated market */
  market: UnusualTradeMarket;
  /** Trade details */
  trade: TradeDetails;
  /** Detection information */
  detection: DetectionInfo;
  /** When the trade was detected (ISO 8601) */
  detectedAt: string;
}

/**
 * Parameters for listing unusual trades.
 */
export interface UnusualTradeListParams {
  /** Maximum results per page (default: 50, max: 100) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Filter by market ID */
  marketId?: string;
  /** Filter by detection reason */
  reason?: DetectionReason;
  /** Minimum anomaly score */
  minScore?: number;
  /** Only trades since this date (ISO 8601) */
  since?: string;
  /** Filter by trade side */
  side?: TradeSide;
  /** Filter by source platform */
  source?: MarketSource;
  /** Categories to exclude (comma-separated) */
  excludeCategories?: string;
}
