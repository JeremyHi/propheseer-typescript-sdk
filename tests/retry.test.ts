import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseClient } from '../src/core/base-client.js';
import { RateLimitError, InternalServerError, APIConnectionError } from '../src/errors.js';

describe('Retry logic', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('succeeds on first attempt', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new BaseClient({ apiKey: 'pk_test_123' });
    const result = await client.request({ method: 'GET', path: '/v1/test' });

    expect(result.data).toEqual({ data: 'ok' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 errors', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'server error' }), { status: 500 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'ok' }), { status: 200 }),
      );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 2 });
    const result = await client.request({ method: 'GET', path: '/v1/test' });

    expect(result.data).toEqual({ data: 'ok' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 errors', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'rate limited', retryAfter: 1 }), { status: 429 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'ok' }), { status: 200 }),
      );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 2 });
    const result = await client.request({ method: 'GET', path: '/v1/test' });

    expect(result.data).toEqual({ data: 'ok' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx errors (except 429)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'not found' }), { status: 404 }),
    );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/v1/test' }),
    ).rejects.toThrow('not found');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws after max retries exhausted', async () => {
    fetchSpy
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'server error' }), { status: 500 }),
      );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 1 });

    await expect(
      client.request({ method: 'GET', path: '/v1/test' }),
    ).rejects.toThrow(InternalServerError);

    expect(fetchSpy).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('retries on network errors', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'ok' }), { status: 200 }),
      );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 2 });
    const result = await client.request({ method: 'GET', path: '/v1/test' });

    expect(result.data).toEqual({ data: 'ok' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws APIConnectionError for persistent network errors', async () => {
    fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 1 });

    await expect(
      client.request({ method: 'GET', path: '/v1/test' }),
    ).rejects.toThrow(APIConnectionError);
  });

  it('skips retry when maxRetries is 0', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'server error' }), { status: 500 }),
    );

    const client = new BaseClient({ apiKey: 'pk_test_123', maxRetries: 0 });

    await expect(
      client.request({ method: 'GET', path: '/v1/test' }),
    ).rejects.toThrow(InternalServerError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
