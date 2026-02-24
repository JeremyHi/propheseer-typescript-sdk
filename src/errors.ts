/**
 * Base error class for all Propheseer SDK errors.
 */
export class PropheseerError extends Error {
  /** HTTP status code (if applicable) */
  readonly status: number | undefined;
  /** Error code from the API */
  readonly code: string | undefined;
  /** Response headers */
  readonly headers: Headers | undefined;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      headers?: Headers;
    },
  ) {
    super(message);
    this.name = 'PropheseerError';
    this.status = options?.status;
    this.code = options?.code;
    this.headers = options?.headers;
  }
}

/**
 * Thrown when the API key is missing or invalid (HTTP 401).
 */
export class AuthenticationError extends PropheseerError {
  constructor(message: string, headers?: Headers) {
    super(message, { status: 401, code: 'UNAUTHORIZED', headers });
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the user has insufficient credits (HTTP 402).
 */
export class InsufficientCreditsError extends PropheseerError {
  /** Current balance in cents */
  readonly balanceCents: number | undefined;
  /** Required amount in cents */
  readonly requiredCents: number | undefined;

  constructor(
    message: string,
    options?: { balanceCents?: number; requiredCents?: number; headers?: Headers },
  ) {
    super(message, { status: 402, code: 'INSUFFICIENT_CREDITS', headers: options?.headers });
    this.name = 'InsufficientCreditsError';
    this.balanceCents = options?.balanceCents;
    this.requiredCents = options?.requiredCents;
  }
}

/**
 * Thrown when the user lacks permission for the requested resource (HTTP 403).
 */
export class PermissionDeniedError extends PropheseerError {
  /** Plan required to access the resource */
  readonly requiredPlan: string | undefined;

  constructor(
    message: string,
    options?: { code?: string; requiredPlan?: string; headers?: Headers },
  ) {
    super(message, { status: 403, code: options?.code ?? 'FORBIDDEN', headers: options?.headers });
    this.name = 'PermissionDeniedError';
    this.requiredPlan = options?.requiredPlan;
  }
}

/**
 * Thrown when the requested resource is not found (HTTP 404).
 */
export class NotFoundError extends PropheseerError {
  constructor(message: string, headers?: Headers) {
    super(message, { status: 404, code: 'NOT_FOUND', headers });
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when rate limits are exceeded (HTTP 429).
 */
export class RateLimitError extends PropheseerError {
  /** Seconds to wait before retrying */
  readonly retryAfter: number | undefined;

  constructor(message: string, options?: { retryAfter?: number; headers?: Headers }) {
    super(message, { status: 429, code: 'RATE_LIMITED', headers: options?.headers });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Thrown when the API returns a server error (HTTP 5xx).
 */
export class InternalServerError extends PropheseerError {
  constructor(message: string, options?: { status?: number; headers?: Headers }) {
    super(message, { status: options?.status ?? 500, code: 'INTERNAL_ERROR', headers: options?.headers });
    this.name = 'InternalServerError';
  }
}

/**
 * Thrown when a network or connection error occurs.
 */
export class APIConnectionError extends PropheseerError {
  readonly cause: Error | undefined;

  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'APIConnectionError';
    this.cause = options?.cause;
  }
}
