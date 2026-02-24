import type { BaseClient } from '../core/base-client.js';
import type { APIResponse } from '../types/shared.js';
import type { TickerItem, TickerListParams } from '../types/ticker.js';

export class Ticker {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * List ticker items (public, no auth required).
   *
   * @example
   * ```ts
   * const { data: items } = await client.ticker.list({ limit: 10 });
   * for (const item of items) {
   *   console.log(`${item.question}: ${(item.probability * 100).toFixed(0)}%`);
   * }
   * ```
   */
  async list(params: TickerListParams = {}): Promise<APIResponse<TickerItem[]>> {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: params.limit,
    };

    const result = await this.client.request<{ data: TickerItem[]; meta: Record<string, unknown> }>({
      method: 'GET',
      path: '/v1/public/ticker',
      query,
      auth: false,
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }
}
