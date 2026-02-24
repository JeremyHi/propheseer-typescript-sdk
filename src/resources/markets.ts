import type { BaseClient } from '../core/base-client.js';
import type { APIResponse, PaginationMeta } from '../types/shared.js';
import type { Market, MarketListParams } from '../types/markets.js';
import { Page, autoPaginate, type AutoPaginateOptions } from '../pagination.js';

export class Markets {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * List markets with optional filters.
   *
   * @example
   * ```ts
   * const page = await client.markets.list({ source: 'polymarket', limit: 10 });
   * console.log(page.data); // Market[]
   * console.log(page.meta.total); // total matching markets
   * ```
   */
  async list(params: MarketListParams = {}): Promise<Page<Market>> {
    const query: Record<string, string | number | boolean | undefined> = {
      source: params.source,
      category: params.category,
      status: params.status,
      q: params.q,
      limit: params.limit,
      offset: params.offset,
    };

    const result = await this.client.request<{ data: Market[]; meta: PaginationMeta }>({
      method: 'GET',
      path: '/v1/markets',
      query,
    });

    return new Page(result.data.data, result.data.meta, result.rateLimit);
  }

  /**
   * Get a single market by ID.
   *
   * @example
   * ```ts
   * const { data: market } = await client.markets.get('pm_12345');
   * ```
   */
  async get(id: string): Promise<APIResponse<Market>> {
    const result = await this.client.request<{ data: Market }>({
      method: 'GET',
      path: `/v1/markets/${encodeURIComponent(id)}`,
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }

  /**
   * Auto-paginate through all markets matching the query.
   *
   * @example
   * ```ts
   * for await (const market of client.markets.listAutoPaginate({ source: 'kalshi' })) {
   *   console.log(market.question);
   * }
   * ```
   */
  listAutoPaginate(
    params: Omit<MarketListParams, 'offset'> = {},
    options: AutoPaginateOptions = {},
  ): AsyncGenerator<Market, void, undefined> {
    const limit = params.limit ?? 50;
    return autoPaginate(
      (offset) => this.list({ ...params, limit, offset }),
      options,
    );
  }
}
