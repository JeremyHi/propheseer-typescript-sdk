import type { BaseClient } from '../core/base-client.js';
import type { APIResponse } from '../types/shared.js';
import type { Category } from '../types/categories.js';

export class Categories {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * List all available market categories.
   *
   * @example
   * ```ts
   * const { data: categories } = await client.categories.list();
   * ```
   */
  async list(): Promise<APIResponse<Category[]>> {
    const result = await this.client.request<{ data: Category[]; meta: { total: number } }>({
      method: 'GET',
      path: '/v1/categories',
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }
}
