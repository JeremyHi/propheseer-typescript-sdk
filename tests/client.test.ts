import { describe, it, expect } from 'vitest';
import { Propheseer } from '../src/client.js';
import { AuthenticationError } from '../src/errors.js';

describe('Propheseer client', () => {
  it('creates a client with an API key', () => {
    const client = new Propheseer({ apiKey: 'pk_test_123' });
    expect(client.apiKey).toBe('pk_test_123');
    expect(client.baseURL).toBe('https://api.propheseer.com');
  });

  it('uses custom base URL', () => {
    const client = new Propheseer({
      apiKey: 'pk_test_123',
      baseURL: 'http://localhost:3000',
    });
    expect(client.baseURL).toBe('http://localhost:3000');
  });

  it('strips trailing slash from base URL', () => {
    const client = new Propheseer({
      apiKey: 'pk_test_123',
      baseURL: 'http://localhost:3000/',
    });
    expect(client.baseURL).toBe('http://localhost:3000');
  });

  it('has all resource namespaces', () => {
    const client = new Propheseer({ apiKey: 'pk_test_123' });
    expect(client.markets).toBeDefined();
    expect(client.categories).toBeDefined();
    expect(client.arbitrage).toBeDefined();
    expect(client.unusualTrades).toBeDefined();
    expect(client.history).toBeDefined();
    expect(client.keys).toBeDefined();
    expect(client.ticker).toBeDefined();
  });

  it('throws AuthenticationError when API key is missing on auth request', async () => {
    const client = new Propheseer({});
    await expect(client.markets.list()).rejects.toThrow(AuthenticationError);
  });

  it('uses default timeout and retries', () => {
    const client = new Propheseer({ apiKey: 'pk_test_123' });
    expect(client.timeout).toBe(30_000);
    expect(client.maxRetries).toBe(2);
  });

  it('allows custom timeout and retries', () => {
    const client = new Propheseer({
      apiKey: 'pk_test_123',
      timeout: 10_000,
      maxRetries: 5,
    });
    expect(client.timeout).toBe(10_000);
    expect(client.maxRetries).toBe(5);
  });
});
