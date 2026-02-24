import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Propheseer } from '../../src/client.js';
import { Page } from '../../src/pagination.js';

const mockMarket = {
  id: 'pm_123',
  source: 'polymarket',
  sourceId: '123',
  question: 'Will it rain tomorrow?',
  description: null,
  category: 'science',
  status: 'open',
  outcomes: [
    { name: 'Yes', probability: 0.65, volume24h: 50000 },
    { name: 'No', probability: 0.35, volume24h: 50000 },
  ],
  resolutionDate: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  url: 'https://polymarket.com/event/rain',
  imageUrl: null,
  tags: ['Weather'],
};

describe('Markets resource', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('list returns a Page of markets', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [mockMarket],
          meta: { total: 1, limit: 50, offset: 0 },
        }),
        {
          status: 200,
          headers: {
            'x-ratelimit-plan': 'pro',
            'x-billing-type': 'subscription',
            'x-ratelimit-limit-day': '10000',
            'x-ratelimit-remaining-day': '9999',
          },
        },
      ),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    const page = await client.markets.list();

    expect(page).toBeInstanceOf(Page);
    expect(page.data).toHaveLength(1);
    expect(page.data[0].id).toBe('pm_123');
    expect(page.meta.total).toBe(1);
    expect(page.rateLimit?.plan).toBe('pro');
    expect(page.rateLimit?.remainingDay).toBe(9999);
  });

  it('list passes query parameters', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: [], meta: { total: 0, limit: 10, offset: 0 } }),
        { status: 200 },
      ),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    await client.markets.list({
      source: 'kalshi',
      category: 'politics',
      status: 'open',
      q: 'election',
      limit: 10,
      offset: 5,
    });

    const url = new URL(fetchSpy.mock.calls[0][0]);
    expect(url.searchParams.get('source')).toBe('kalshi');
    expect(url.searchParams.get('category')).toBe('politics');
    expect(url.searchParams.get('status')).toBe('open');
    expect(url.searchParams.get('q')).toBe('election');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('5');
  });

  it('get returns a single market', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: mockMarket }), { status: 200 }),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    const result = await client.markets.get('pm_123');

    expect(result.data.id).toBe('pm_123');
    expect(result.data.question).toBe('Will it rain tomorrow?');
  });

  it('get encodes the market ID', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: mockMarket }), { status: 200 }),
    );

    const client = new Propheseer({ apiKey: 'pk_test_123' });
    await client.markets.get('pm_special/id');

    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain('pm_special%2Fid');
  });
});
