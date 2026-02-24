import type { BaseClient } from '../core/base-client.js';
import type { PaginationMeta } from '../types/shared.js';
import type { UnusualTrade, UnusualTradeListParams } from '../types/unusual-trades.js';
import { Page, autoPaginate, type AutoPaginateOptions } from '../pagination.js';

export class UnusualTrades {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * List unusual trades detected by the system.
   * Requires Pro plan or higher.
   *
   * @example
   * ```ts
   * const page = await client.unusualTrades.list({ reason: 'high_amount', limit: 10 });
   * for (const trade of page.data) {
   *   console.log(`${trade.market.question}: $${trade.trade.usdcValue}`);
   * }
   * ```
   */
  async list(params: UnusualTradeListParams = {}): Promise<Page<UnusualTrade>> {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: params.limit,
      offset: params.offset,
      market_id: params.marketId,
      reason: params.reason,
      min_score: params.minScore,
      since: params.since,
      side: params.side,
      source: params.source,
      exclude_categories: params.excludeCategories,
    };

    const result = await this.client.request<{ data: UnusualTrade[]; meta: PaginationMeta }>({
      method: 'GET',
      path: '/v1/unusual-trades',
      query,
    });

    return new Page(result.data.data, result.data.meta, result.rateLimit);
  }

  /**
   * Auto-paginate through all unusual trades matching the query.
   *
   * @example
   * ```ts
   * for await (const trade of client.unusualTrades.listAutoPaginate({ since: '2025-01-01' })) {
   *   console.log(trade.detection.reason);
   * }
   * ```
   */
  listAutoPaginate(
    params: Omit<UnusualTradeListParams, 'offset'> = {},
    options: AutoPaginateOptions = {},
  ): AsyncGenerator<UnusualTrade, void, undefined> {
    const limit = params.limit ?? 50;
    return autoPaginate(
      (offset) => this.list({ ...params, limit, offset }),
      options,
    );
  }
}
