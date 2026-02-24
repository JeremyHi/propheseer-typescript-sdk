import { describe, it, expect } from 'vitest';
import {
  PropheseerError,
  AuthenticationError,
  InsufficientCreditsError,
  PermissionDeniedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
} from '../src/errors.js';

describe('Error classes', () => {
  it('PropheseerError has correct properties', () => {
    const err = new PropheseerError('test error', { status: 400, code: 'BAD_REQUEST' });
    expect(err.message).toBe('test error');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.name).toBe('PropheseerError');
    expect(err).toBeInstanceOf(Error);
  });

  it('AuthenticationError is 401', () => {
    const err = new AuthenticationError('bad key');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.name).toBe('AuthenticationError');
    expect(err).toBeInstanceOf(PropheseerError);
  });

  it('InsufficientCreditsError is 402', () => {
    const err = new InsufficientCreditsError('no credits', {
      balanceCents: 50,
      requiredCents: 100,
    });
    expect(err.status).toBe(402);
    expect(err.balanceCents).toBe(50);
    expect(err.requiredCents).toBe(100);
    expect(err.name).toBe('InsufficientCreditsError');
  });

  it('PermissionDeniedError is 403', () => {
    const err = new PermissionDeniedError('upgrade needed', {
      requiredPlan: 'pro',
    });
    expect(err.status).toBe(403);
    expect(err.requiredPlan).toBe('pro');
    expect(err.name).toBe('PermissionDeniedError');
  });

  it('NotFoundError is 404', () => {
    const err = new NotFoundError('not found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });

  it('RateLimitError is 429', () => {
    const err = new RateLimitError('slow down', { retryAfter: 30 });
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(30);
    expect(err.name).toBe('RateLimitError');
  });

  it('InternalServerError defaults to 500', () => {
    const err = new InternalServerError('server error');
    expect(err.status).toBe(500);
    expect(err.name).toBe('InternalServerError');
  });

  it('InternalServerError accepts custom status', () => {
    const err = new InternalServerError('bad gateway', { status: 502 });
    expect(err.status).toBe(502);
  });

  it('APIConnectionError has no status', () => {
    const cause = new Error('ECONNREFUSED');
    const err = new APIConnectionError('connection failed', { cause });
    expect(err.status).toBeUndefined();
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('APIConnectionError');
  });

  it('all errors extend PropheseerError', () => {
    const errors = [
      new AuthenticationError(''),
      new InsufficientCreditsError(''),
      new PermissionDeniedError(''),
      new NotFoundError(''),
      new RateLimitError(''),
      new InternalServerError(''),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(PropheseerError);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('APIConnectionError extends PropheseerError', () => {
    const err = new APIConnectionError('timeout');
    expect(err).toBeInstanceOf(PropheseerError);
  });
});
