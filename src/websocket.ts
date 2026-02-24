import { EventEmitter } from 'events';
import { VERSION } from './version.js';

/**
 * WebSocket message types received from the server.
 */
export interface WSConnectedMessage {
  type: 'connected';
  sessionId: string;
  plan: string;
  limits: {
    maxSubscriptions: number;
    messagesPerMinute: number;
    maxConnections: number;
    monthlyDataMB: number;
  };
}

export interface WSMarketUpdateMessage {
  type: 'market_update';
  market: Record<string, unknown>;
  timestamp: string;
}

export interface WSMarketSnapshotMessage {
  type: 'market_snapshot';
  market: Record<string, unknown>;
  timestamp: string;
}

export interface WSSubscribedMessage {
  type: 'subscribed';
  markets: string[];
  alreadySubscribed: string[];
  notFound: string[];
  subscriptionCount: number;
}

export interface WSUnsubscribedMessage {
  type: 'unsubscribed';
  markets: string[];
  notSubscribed: string[];
  subscriptionCount: number;
}

export interface WSSubscriptionsMessage {
  type: 'subscriptions';
  markets: string[];
  count: number;
}

export interface WSPongMessage {
  type: 'pong';
  timestamp: string;
}

export interface WSErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export type WSMessage =
  | WSConnectedMessage
  | WSMarketUpdateMessage
  | WSMarketSnapshotMessage
  | WSSubscribedMessage
  | WSUnsubscribedMessage
  | WSSubscriptionsMessage
  | WSPongMessage
  | WSErrorMessage;

export interface PropheseerWebSocketOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Base WebSocket URL (default: wss://api.propheseer.com) */
  baseURL?: string;
  /** Whether to automatically reconnect on disconnect (default: true) */
  reconnect?: boolean;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Ping interval in ms to keep connection alive (default: 25000) */
  pingInterval?: number;
}

export interface PropheseerWebSocketEvents {
  connected: (message: WSConnectedMessage) => void;
  market_update: (message: WSMarketUpdateMessage) => void;
  market_snapshot: (message: WSMarketSnapshotMessage) => void;
  subscribed: (message: WSSubscribedMessage) => void;
  unsubscribed: (message: WSUnsubscribedMessage) => void;
  error: (error: WSErrorMessage | Error) => void;
  disconnect: (code: number, reason: string) => void;
  reconnect: (attempt: number) => void;
}

/**
 * WebSocket client for real-time market updates.
 *
 * @example
 * ```ts
 * const ws = new PropheseerWebSocket({ apiKey: 'pk_test_...' });
 *
 * ws.on('connected', (msg) => {
 *   console.log('Connected:', msg.sessionId);
 *   ws.subscribe(['pm_12345', 'ks_67890']);
 * });
 *
 * ws.on('market_update', (msg) => {
 *   console.log('Update:', msg.market);
 * });
 *
 * await ws.connect();
 * ```
 */
export class PropheseerWebSocket extends EventEmitter {
  private apiKey: string;
  private baseURL: string;
  private reconnectEnabled: boolean;
  private maxReconnectAttempts: number;
  private pingIntervalMs: number;

  private ws: import('ws').WebSocket | WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private subscribedMarkets: Set<string> = new Set();
  private closed = false;

  constructor(options: PropheseerWebSocketOptions = {}) {
    super();

    const apiKey = options.apiKey ?? process.env?.PROPHESEER_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required for WebSocket connection');
    }

    this.apiKey = apiKey;
    this.baseURL = (options.baseURL ?? 'wss://api.propheseer.com').replace(/^http/, 'ws');
    this.reconnectEnabled = options.reconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.pingIntervalMs = options.pingInterval ?? 25_000;
  }

  /**
   * Connect to the WebSocket server.
   */
  async connect(): Promise<void> {
    this.closed = false;
    const url = `${this.baseURL}/ws?api_key=${encodeURIComponent(this.apiKey)}`;

    return new Promise((resolve, reject) => {
      try {
        // Try to use ws package (Node.js) or native WebSocket (browser/Deno)
        const WS = this.getWebSocketConstructor();
        const ws = new WS(url, {
          headers: { 'User-Agent': `propheseer-typescript/${VERSION}` },
        } as unknown as string[]);

        this.ws = ws as unknown as WebSocket;

        const onOpen = () => {
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        const onMessage = (event: { data: unknown } | Buffer) => {
          try {
            const raw = typeof event === 'object' && 'data' in event
              ? String(event.data)
              : String(event);
            const message = JSON.parse(raw) as WSMessage;
            this.handleMessage(message);
          } catch {
            // ignore parse errors
          }
        };

        const onClose = (event: { code?: number; reason?: string } | number) => {
          this.stopPing();
          const code = typeof event === 'number' ? event : (event.code ?? 1000);
          const reason = typeof event === 'number' ? '' : (event.reason ?? '');
          this.emit('disconnect', code, reason);

          if (!this.closed && this.reconnectEnabled) {
            this.attemptReconnect();
          }
        };

        const onError = (error: Error | Event) => {
          const err = error instanceof Error ? error : new Error('WebSocket error');
          this.emit('error', err);
          if (this.reconnectAttempts === 0) {
            reject(err);
          }
        };

        // Attach event listeners (works for both ws and native WebSocket)
        if ('on' in ws) {
          // Node.js ws library — use `any` cast since ws and native WebSocket
          // have incompatible listener signatures
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const wsNode = ws as any;
          wsNode.on('open', onOpen);
          wsNode.on('message', onMessage);
          wsNode.on('close', onClose);
          wsNode.on('error', onError);
        } else {
          // Native WebSocket
          (ws as WebSocket).onopen = onOpen;
          (ws as WebSocket).onmessage = onMessage as unknown as (event: MessageEvent) => void;
          (ws as WebSocket).onclose = onClose as unknown as (event: CloseEvent) => void;
          (ws as WebSocket).onerror = onError as unknown as (event: Event) => void;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to real-time updates for specific market IDs.
   */
  subscribe(marketIds: string[]): void {
    for (const id of marketIds) {
      this.subscribedMarkets.add(id);
    }
    this.send({ type: 'subscribe', markets: marketIds });
  }

  /**
   * Unsubscribe from market updates.
   */
  unsubscribe(marketIds: string[]): void {
    for (const id of marketIds) {
      this.subscribedMarkets.delete(id);
    }
    this.send({ type: 'unsubscribe', markets: marketIds });
  }

  /**
   * Request the current list of subscribed markets.
   */
  listSubscriptions(): void {
    this.send({ type: 'list_subscriptions' });
  }

  /**
   * Close the WebSocket connection.
   */
  close(): void {
    this.closed = true;
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'Client closed');
      this.ws = null;
    }
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'connected':
        this.emit('connected', message);
        break;
      case 'market_update':
        this.emit('market_update', message);
        break;
      case 'market_snapshot':
        this.emit('market_snapshot', message);
        break;
      case 'subscribed':
        this.emit('subscribed', message);
        break;
      case 'unsubscribed':
        this.emit('unsubscribed', message);
        break;
      case 'error':
        this.emit('error', message);
        break;
      default:
        // pong, subscriptions, etc.
        break;
    }
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws && this.getReadyState() === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private getReadyState(): number {
    if (!this.ws) return 3; // CLOSED
    return (this.ws as unknown as { readyState: number }).readyState;
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30_000);

    this.emit('reconnect', this.reconnectAttempts);

    await new Promise(resolve => setTimeout(resolve, delay));

    if (this.closed) return;

    try {
      await this.connect();

      // Re-subscribe to previously subscribed markets
      if (this.subscribedMarkets.size > 0) {
        this.subscribe([...this.subscribedMarkets]);
      }
    } catch {
      // connect() will emit error, and onClose will trigger another reconnect attempt
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getWebSocketConstructor(): any {
    // Try Node.js ws package first
    try {
      // Dynamic require for ws
      return require('ws');
    } catch {
      // Fall back to native WebSocket (browser, Deno, Bun)
      if (typeof WebSocket !== 'undefined') {
        return WebSocket;
      }
      throw new Error(
        'No WebSocket implementation found. Install the "ws" package: npm install ws',
      );
    }
  }
}
