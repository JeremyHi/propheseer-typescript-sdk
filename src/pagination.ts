import type { RateLimitInfo, PaginationMeta } from './types/shared.js';

/**
 * A page of results from a paginated API endpoint.
 */
export class Page<T> {
  /** Items on this page */
  readonly data: T[];
  /** Pagination metadata */
  readonly meta: PaginationMeta;
  /** Rate limit information */
  readonly rateLimit: RateLimitInfo | null;

  constructor(data: T[], meta: PaginationMeta, rateLimit: RateLimitInfo | null) {
    this.data = data;
    this.meta = meta;
    this.rateLimit = rateLimit;
  }

  /** Whether there are more pages available */
  hasMore(): boolean {
    return this.meta.offset + this.meta.limit < this.meta.total;
  }

  /** The offset for the next page, or null if no more pages */
  nextOffset(): number | null {
    if (!this.hasMore()) return null;
    return this.meta.offset + this.meta.limit;
  }
}

/**
 * Options for auto-pagination.
 */
export interface AutoPaginateOptions {
  /** Maximum total items to yield (default: unlimited) */
  maxItems?: number;
}

/**
 * Creates an async generator that automatically paginates through all results.
 *
 * @param fetchPage - Function that fetches a page given an offset
 * @param options - Auto-pagination options
 * @returns AsyncGenerator yielding individual items
 */
export async function* autoPaginate<T>(
  fetchPage: (offset: number) => Promise<Page<T>>,
  options: AutoPaginateOptions = {},
): AsyncGenerator<T, void, undefined> {
  let offset = 0;
  let yielded = 0;

  while (true) {
    const page = await fetchPage(offset);

    for (const item of page.data) {
      yield item;
      yielded++;

      if (options.maxItems && yielded >= options.maxItems) {
        return;
      }
    }

    if (!page.hasMore() || page.data.length === 0) {
      return;
    }

    offset = page.nextOffset()!;
  }
}
