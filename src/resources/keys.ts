import type { BaseClient } from '../core/base-client.js';
import type { APIResponse } from '../types/shared.js';
import type { KeyInfo } from '../types/keys.js';

export class Keys {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * Get information about the current API key, including usage statistics.
   *
   * @example
   * ```ts
   * const { data: keyInfo } = await client.keys.me();
   * console.log(`Plan: ${keyInfo.plan}`);
   * console.log(`Daily usage: ${keyInfo.usage.daily}/${keyInfo.limits.requestsPerDay}`);
   * ```
   */
  async me(): Promise<APIResponse<KeyInfo>> {
    const result = await this.client.request<{ data: KeyInfo }>({
      method: 'GET',
      path: '/v1/keys/me',
    });

    return { data: result.data.data, rateLimit: result.rateLimit, response: result.response };
  }
}
