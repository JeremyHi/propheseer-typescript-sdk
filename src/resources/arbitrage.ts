import type { BaseClient } from '../core/base-client.js';
import type { APIResponse } from '../types/shared.js';
import type { ArbitrageOpportunity, ArbitrageFindParams } from '../types/arbitrage.js';

export class Arbitrage {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * Find arbitrage opportunities across platforms.
   * Requires Pro plan or higher.
   *
   * @example
   * ```ts
   * const { data: opportunities } = await client.arbitrage.find({ minSpread: 0.05 });
   * for (const opp of opportunities) {
   *   console.log(`${opp.question}: ${opp.potentialReturn}`);
   * }
   * ```
   */
  async find(params: ArbitrageFindParams = {}): Promise<APIResponse<ArbitrageOpportunity[]>> {
    const query: Record<string, string | number | boolean | undefined> = {
      min_spread: params.minSpread,
      category: params.category,
    };

    const result = await this.client.request<{ data: ArbitrageOpportunity[]; meta: { total: number } }>({
      method: 'GET',
      path: '/v1/arbitrage',
      query,
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }
}
