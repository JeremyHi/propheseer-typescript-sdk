import type { MarketSource, MarketCategory } from './markets.js';

/**
 * A market involved in an arbitrage opportunity.
 */
export interface ArbitrageMarket {
  /** Source platform */
  source: MarketSource;
  /** Yes price (probability) */
  yesPrice: number;
  /** URL to the market */
  url: string;
}

/**
 * An arbitrage opportunity across platforms.
 */
export interface ArbitrageOpportunity {
  /** The market question */
  question: string;
  /** Price spread between platforms (decimal) */
  spread: number;
  /** Potential return percentage (e.g. "5.2%") */
  potentialReturn: string;
  /** Markets involved in the opportunity */
  markets: ArbitrageMarket[];
}

/**
 * Parameters for finding arbitrage opportunities.
 */
export interface ArbitrageFindParams {
  /** Minimum spread to include (default: 0.03) */
  minSpread?: number;
  /** Filter by category */
  category?: MarketCategory;
}
