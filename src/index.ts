export { Propheseer, Propheseer as default } from './client.js';

// Core
export { Page, autoPaginate } from './pagination.js';
export type { AutoPaginateOptions } from './pagination.js';
export { PropheseerWebSocket } from './websocket.js';
export type {
  PropheseerWebSocketOptions,
  PropheseerWebSocketEvents,
  WSMessage,
  WSConnectedMessage,
  WSMarketUpdateMessage,
  WSMarketSnapshotMessage,
  WSSubscribedMessage,
  WSUnsubscribedMessage,
  WSErrorMessage,
} from './websocket.js';
export { VERSION } from './version.js';

// Errors
export {
  PropheseerError,
  AuthenticationError,
  InsufficientCreditsError,
  PermissionDeniedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
} from './errors.js';

// Types - Shared
export type { RateLimitInfo, APIResponse, PaginationMeta } from './types/shared.js';

// Types - Markets
export type {
  Market,
  Outcome,
  MarketSource,
  MarketStatus,
  MarketCategory,
  MarketListParams,
} from './types/markets.js';

// Types - Categories
export type { Category } from './types/categories.js';

// Types - Arbitrage
export type {
  ArbitrageOpportunity,
  ArbitrageMarket,
  ArbitrageFindParams,
} from './types/arbitrage.js';

// Types - Unusual Trades
export type {
  UnusualTrade,
  UnusualTradeMarket,
  TradeDetails,
  DetectionInfo,
  DetectionReason,
  TradeSide,
  UnusualTradeListParams,
} from './types/unusual-trades.js';

// Types - History
export type {
  MarketHistoryEntry,
  HistoryListParams,
  SnapshotDate,
} from './types/history.js';

// Types - Keys
export type {
  KeyInfo,
  KeyUsage,
  UsageHistoryEntry,
  PlanLimits,
} from './types/keys.js';

// Types - Ticker
export type { TickerItem, TickerListParams } from './types/ticker.js';

// Client options
export type { ClientOptions } from './core/base-client.js';
