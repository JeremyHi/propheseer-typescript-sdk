import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Propheseer } from '../../src/client.js';
import { PermissionDeniedError } from '../../src/errors.js';

const mockOpportunity = {
  question: 'Who will win?',
  spread: 0.05,
  potentialReturn: '5.3%',
  markets: [
    { source: 'polymarket', yesPrice: 0.65, url: 'https://polymarket.com/...' },
    { source: 'kalshi', yesPrice: 0.60, url: 'https://kalshi.com/...' },
  ],
};

describe('Arbitrage resource', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('find returns arbitrage opportunities', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: [mockOpportunity], meta: { total: 1 } }),
        { status: 200 },
      ),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    const result = await client.arbitrage.find();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].spread).toBe(0.05);
    expect(result.data[0].markets).toHaveLength(2);
  });

  it('find passes min_spread parameter', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: [], meta: { total: 0 } }),
        { status: 200 },
      ),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    await client.arbitrage.find({ minSpread: 0.10 });

    const url = new URL(fetchSpy.mock.calls[0][0]);
    expect(url.searchParams.get('min_spread')).toBe('0.1');
  });

  it('throws PermissionDeniedError for free plan', async () => {
    const errorBody = {
      error: 'Arbitrage detection requires a Pro or Business plan',
      code: 'PLAN_UPGRADE_REQUIRED',
      requiredPlan: 'pro',
    };

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 403 }),
    );

    const client = new Propheseer({ apiKey: 'pk_test_free' });

    try {
      await client.arbitrage.find();
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PermissionDeniedError);
      expect((err as PermissionDeniedError).requiredPlan).toBe('pro');
    }
  });
});
