# Propheseer TypeScript SDK

Official TypeScript/JavaScript SDK for the [Propheseer](https://propheseer.com) prediction markets API. Access normalized data from Polymarket, Kalshi, and Gemini through a single, type-safe interface.

## Installation

```bash
npm install propheseer
```

For WebSocket support (real-time market updates):

```bash
npm install propheseer ws
```

## Quick Start

```typescript
import Propheseer from 'propheseer';

const client = new Propheseer({
  apiKey: 'pk_test_...', // or set PROPHESEER_API_KEY env var
});

// List prediction markets
const page = await client.markets.list({ source: 'polymarket', limit: 10 });
for (const market of page.data) {
  console.log(`${market.question}: ${(market.outcomes[0].probability * 100).toFixed(0)}%`);
}

// Check your API key usage
const { data: keyInfo } = await client.keys.me();
console.log(`Plan: ${keyInfo.plan}, Daily usage: ${keyInfo.usage.daily}`);
```

## Configuration

```typescript
const client = new Propheseer({
  apiKey: 'pk_test_...', // Required (or PROPHESEER_API_KEY env var)
  baseURL: 'https://api.propheseer.com', // Default
  timeout: 30_000, // Request timeout in ms (default: 30s)
  maxRetries: 2, // Retries on 429/5xx errors (default: 2)
});
```

## Resources

### Markets

```typescript
// List markets with filters
const page = await client.markets.list({
  source: 'polymarket', // 'polymarket' | 'kalshi' | 'gemini'
  category: 'politics', // 'politics' | 'sports' | 'finance' | ...
  status: 'open',
  q: 'election', // search query
  limit: 50,
  offset: 0,
});

// Get a single market
const { data: market } = await client.markets.get('pm_12345');

// Auto-paginate through all markets
for await (const market of client.markets.listAutoPaginate({ source: 'kalshi' })) {
  console.log(market.question);
}
```

### Categories

```typescript
const { data: categories } = await client.categories.list();
// [{ id: 'politics', name: 'Politics', subcategories: ['elections', ...] }, ...]
```

### Arbitrage (Pro+)

```typescript
const { data: opportunities } = await client.arbitrage.find({
  minSpread: 0.05,
  category: 'politics',
});

for (const opp of opportunities) {
  console.log(`${opp.question}: spread=${opp.spread}, return=${opp.potentialReturn}`);
}
```

### Unusual Trades (Pro+)

```typescript
const page = await client.unusualTrades.list({
  reason: 'high_amount',
  since: '2025-01-01T00:00:00Z',
  limit: 20,
});

for (const trade of page.data) {
  console.log(`$${trade.trade.usdcValue} ${trade.trade.side} on "${trade.market.question}"`);
}

// Auto-paginate
for await (const trade of client.unusualTrades.listAutoPaginate()) {
  console.log(trade.detection.reason, trade.detection.anomalyScore);
}
```

### History (Business+)

```typescript
// Market price history
const { data: history } = await client.history.list({
  marketId: 'pm_12345',
  days: 7,
});

// Available snapshot dates
const { data: dates } = await client.history.dates();
```

### Ticker (Public)

```typescript
// No auth required
const { data: items } = await client.ticker.list({ limit: 10 });
```

## Pagination

Paginated endpoints return a `Page<T>` object:

```typescript
const page = await client.markets.list({ limit: 50 });
console.log(page.data);        // Market[]
console.log(page.meta.total);  // total matching markets
console.log(page.hasMore());   // boolean
console.log(page.nextOffset()); // number | null
```

For automatic pagination:

```typescript
for await (const market of client.markets.listAutoPaginate({ limit: 50 }, { maxItems: 200 })) {
  // yields individual items, fetching new pages as needed
}
```

## Error Handling

All API errors are thrown as typed exceptions:

```typescript
import { PermissionDeniedError, RateLimitError, AuthenticationError } from 'propheseer';

try {
  await client.arbitrage.find();
} catch (err) {
  if (err instanceof PermissionDeniedError) {
    console.log(`Upgrade to ${err.requiredPlan} plan`);
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${err.retryAfter}s`);
  } else if (err instanceof AuthenticationError) {
    console.log('Invalid API key');
  }
}
```

| Error Class | Status | When |
|------------|--------|------|
| `AuthenticationError` | 401 | Missing or invalid API key |
| `InsufficientCreditsError` | 402 | Not enough credits |
| `PermissionDeniedError` | 403 | Plan upgrade required |
| `NotFoundError` | 404 | Resource not found |
| `RateLimitError` | 429 | Rate limit exceeded |
| `InternalServerError` | 5xx | Server error |
| `APIConnectionError` | - | Network/timeout error |

## WebSocket (Real-Time Updates)

```typescript
import { PropheseerWebSocket } from 'propheseer';

const ws = new PropheseerWebSocket({
  apiKey: 'pk_test_...',
  reconnect: true,           // Auto-reconnect (default: true)
  maxReconnectAttempts: 5,   // Default: 5
  pingInterval: 25_000,      // Keepalive interval (default: 25s)
});

ws.on('connected', (msg) => {
  console.log(`Connected: ${msg.sessionId} (${msg.plan})`);
  ws.subscribe(['pm_12345', 'ks_67890']);
});

ws.on('market_update', (msg) => {
  console.log('Market update:', msg.market);
});

ws.on('market_snapshot', (msg) => {
  console.log('Snapshot:', msg.market);
});

ws.on('error', (err) => console.error(err));
ws.on('disconnect', (code, reason) => console.log('Disconnected:', code, reason));
ws.on('reconnect', (attempt) => console.log('Reconnecting...', attempt));

await ws.connect();

// Later:
ws.unsubscribe(['pm_12345']);
ws.close();
```

## Rate Limit Information

Every API response includes rate limit info:

```typescript
const page = await client.markets.list();
console.log(page.rateLimit);
// {
//   plan: 'pro',
//   billingType: 'subscription',
//   limitDay: 10000,
//   remainingDay: 9950,
//   limitMinute: 100,
//   remainingMinute: 98,
// }
```

## Requirements

- Node.js >= 18 (uses native `fetch`)
- Also works in Bun, Deno, and edge runtimes
- `ws` package required only for WebSocket support

## License

MIT
