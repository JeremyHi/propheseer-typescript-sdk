import { VERSION } from '../version.js';
import type { RateLimitInfo } from '../types/shared.js';
import {
  PropheseerError,
  AuthenticationError,
  InsufficientCreditsError,
  PermissionDeniedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
} from '../errors.js';

export interface ClientOptions {
  /** API key for authentication. Falls back to PROPHESEER_API_KEY env var. */
  apiKey?: string;
  /** Base URL for the API (default: https://api.propheseer.com) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retries on retryable errors (default: 2) */
  maxRetries?: number;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Whether this request requires authentication (default: true) */
  auth?: boolean;
}

interface APIErrorBody {
  error?: string;
  message?: string;
  code?: string;
  requiredPlan?: string;
  balanceCents?: number;
  requiredCents?: number;
  retryAfter?: number;
}

/**
 * Base HTTP client with retry logic, rate limit parsing, and error mapping.
 */
export class BaseClient {
  readonly apiKey: string | undefined;
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey ?? getEnvVar('PROPHESEER_API_KEY');
    this.baseURL = (options.baseURL ?? 'https://api.propheseer.com').replace(/\/+$/, '');
    this.timeout = options.timeout ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /**
   * Make an authenticated API request with retry and error handling.
   */
  async request<T>(config: RequestConfig): Promise<{ data: T; rateLimit: RateLimitInfo | null; response: Response }> {
    const { method, path, query, body, auth = true } = config;

    if (auth && !this.apiKey) {
      throw new AuthenticationError(
        'API key is required. Pass it to the constructor or set the PROPHESEER_API_KEY environment variable.',
      );
    }

    const url = this.buildURL(path, query);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `propheseer-typescript/${VERSION}`,
    };

    if (auth && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.getRetryDelay(attempt, lastError);
        await sleep(delay);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json() as Record<string, unknown>;
          const rateLimit = parseRateLimitHeaders(response.headers);
          return { data: json as T, rateLimit, response };
        }

        // Parse error body
        let errorBody: APIErrorBody = {};
        try {
          errorBody = await response.json() as APIErrorBody;
        } catch {
          // ignore parse errors
        }

        const error = mapStatusToError(response.status, errorBody, response.headers);

        // Only retry on 429 and 5xx
        if (isRetryable(response.status) && attempt < this.maxRetries) {
          lastError = error;
          continue;
        }

        throw error;
      } catch (err) {
        if (err instanceof PropheseerError) {
          throw err;
        }

        const error = err as Error;

        // Handle abort (timeout)
        if (error.name === 'AbortError') {
          const timeoutError = new APIConnectionError(`Request timed out after ${this.timeout}ms`, { cause: error });
          if (attempt < this.maxRetries) {
            lastError = timeoutError;
            continue;
          }
          throw timeoutError;
        }

        // Network errors
        const connError = new APIConnectionError(
          `Connection error: ${error.message}`,
          { cause: error },
        );
        if (attempt < this.maxRetries) {
          lastError = connError;
          continue;
        }
        throw connError;
      }
    }

    // Should not reach here, but just in case
    throw lastError ?? new PropheseerError('Request failed after retries');
  }

  private buildURL(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseURL);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private getRetryDelay(attempt: number, lastError?: Error): number {
    // If we got a retryAfter from rate limit, use it
    if (lastError instanceof RateLimitError && lastError.retryAfter) {
      return lastError.retryAfter * 1000;
    }

    // Exponential backoff with jitter: 0.5s, 1s, 2s, ...
    const baseDelay = 500 * Math.pow(2, attempt - 1);
    const jitter = Math.random() * baseDelay * 0.5;
    return baseDelay + jitter;
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function mapStatusToError(status: number, body: APIErrorBody, headers: Headers): PropheseerError {
  const message = body.error || body.message || `API error: ${status}`;

  switch (status) {
    case 401:
      return new AuthenticationError(message, headers);
    case 402:
      return new InsufficientCreditsError(message, {
        balanceCents: body.balanceCents,
        requiredCents: body.requiredCents,
        headers,
      });
    case 403:
      return new PermissionDeniedError(message, {
        code: body.code,
        requiredPlan: body.requiredPlan,
        headers,
      });
    case 404:
      return new NotFoundError(message, headers);
    case 429:
      return new RateLimitError(message, {
        retryAfter: body.retryAfter,
        headers,
      });
    default:
      if (status >= 500) {
        return new InternalServerError(message, { status, headers });
      }
      return new PropheseerError(message, { status, code: body.code, headers });
  }
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const plan = headers.get('x-ratelimit-plan');
  if (!plan) return null;

  const billingType = (headers.get('x-billing-type') as 'subscription' | 'credits') ?? 'subscription';

  const info: RateLimitInfo = { plan, billingType };

  if (billingType === 'credits') {
    const balanceCents = headers.get('x-credit-balance-cents');
    if (balanceCents) info.creditBalanceCents = parseInt(balanceCents, 10);
    info.creditBalance = headers.get('x-credit-balance') ?? undefined;
    const costCents = headers.get('x-request-cost-cents');
    if (costCents) info.requestCostCents = parseInt(costCents, 10);
    info.requestCost = headers.get('x-request-cost') ?? undefined;
  } else {
    const limitDay = headers.get('x-ratelimit-limit-day');
    if (limitDay) info.limitDay = parseInt(limitDay, 10);
    const remainingDay = headers.get('x-ratelimit-remaining-day');
    if (remainingDay) info.remainingDay = parseInt(remainingDay, 10);
    const limitMinute = headers.get('x-ratelimit-limit-minute');
    if (limitMinute) info.limitMinute = parseInt(limitMinute, 10);
    const remainingMinute = headers.get('x-ratelimit-remaining-minute');
    if (remainingMinute) info.remainingMinute = parseInt(remainingMinute, 10);
  }

  return info;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getEnvVar(name: string): string | undefined {
  // Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  // Deno
  if (typeof Deno !== 'undefined') {
    try {
      return (Deno as unknown as { env: { get(key: string): string | undefined } }).env.get(name);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Deno type declaration for env access
declare const Deno: unknown;
