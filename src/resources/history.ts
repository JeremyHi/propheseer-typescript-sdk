import type { BaseClient } from '../core/base-client.js';
import type { APIResponse } from '../types/shared.js';
import type { MarketHistoryEntry, HistoryListParams, SnapshotDate } from '../types/history.js';

export class History {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * List historical market snapshots.
   * Requires Business plan or higher.
   *
   * @example
   * ```ts
   * const { data: history } = await client.history.list({ marketId: 'pm_12345', days: 7 });
   * ```
   */
  async list(params: HistoryListParams = {}): Promise<APIResponse<MarketHistoryEntry[]>> {
    const query: Record<string, string | number | boolean | undefined> = {
      market_id: params.marketId,
      source: params.source,
      category: params.category,
      days: params.days,
      limit: params.limit,
    };

    const result = await this.client.request<{ data: MarketHistoryEntry[]; meta: Record<string, unknown> }>({
      method: 'GET',
      path: '/v1/markets/history',
      query,
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }

  /**
   * List available snapshot dates.
   * Requires Business plan or higher.
   *
   * @example
   * ```ts
   * const { data: dates } = await client.history.dates();
   * console.log(dates); // [{ date: '2025-02-01', count: 150 }, ...]
   * ```
   */
  async dates(): Promise<APIResponse<SnapshotDate[]>> {
    const result = await this.client.request<{ data: SnapshotDate[]; meta: { total: number } }>({
      method: 'GET',
      path: '/v1/markets/history/dates',
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }
}
