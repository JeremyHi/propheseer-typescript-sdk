import { BaseClient, type ClientOptions } from './core/base-client.js';
import { Markets } from './resources/markets.js';
import { Categories } from './resources/categories.js';
import { Arbitrage } from './resources/arbitrage.js';
import { UnusualTrades } from './resources/unusual-trades.js';
import { History } from './resources/history.js';
import { Keys } from './resources/keys.js';
import { Ticker } from './resources/ticker.js';

/**
 * Propheseer SDK client for the prediction markets API.
 *
 * @example
 * ```ts
 * import Propheseer from 'propheseer';
 *
 * const client = new Propheseer({ apiKey: 'pk_test_...' });
 *
 * // List markets
 * const page = await client.markets.list({ source: 'polymarket' });
 * console.log(page.data);
 *
 * // Find arbitrage (Pro+)
 * const { data: opportunities } = await client.arbitrage.find();
 *
 * // Check your usage
 * const { data: keyInfo } = await client.keys.me();
 * ```
 */
export class Propheseer extends BaseClient {
  /** List and search prediction markets */
  readonly markets: Markets;
  /** List market categories */
  readonly categories: Categories;
  /** Find cross-platform arbitrage opportunities (Pro+) */
  readonly arbitrage: Arbitrage;
  /** Detect unusual trading activity (Pro+) */
  readonly unusualTrades: UnusualTrades;
  /** Access historical market snapshots (Business+) */
  readonly history: History;
  /** Get API key info and usage statistics */
  readonly keys: Keys;
  /** Public market ticker (no auth required) */
  readonly ticker: Ticker;

  constructor(options: ClientOptions = {}) {
    super(options);
    this.markets = new Markets(this);
    this.categories = new Categories(this);
    this.arbitrage = new Arbitrage(this);
    this.unusualTrades = new UnusualTrades(this);
    this.history = new History(this);
    this.keys = new Keys(this);
    this.ticker = new Ticker(this);
  }
}

export default Propheseer;
