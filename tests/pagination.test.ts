import { describe, it, expect } from 'vitest';
import { Page, autoPaginate } from '../src/pagination.js';

describe('Page', () => {
  it('hasMore returns true when more items exist', () => {
    const page = new Page(['a', 'b'], { total: 5, limit: 2, offset: 0 }, null);
    expect(page.hasMore()).toBe(true);
  });

  it('hasMore returns false when all items returned', () => {
    const page = new Page(['a', 'b'], { total: 2, limit: 2, offset: 0 }, null);
    expect(page.hasMore()).toBe(false);
  });

  it('hasMore returns false when at last page', () => {
    const page = new Page(['e'], { total: 5, limit: 2, offset: 4 }, null);
    expect(page.hasMore()).toBe(false);
  });

  it('nextOffset returns correct offset', () => {
    const page = new Page(['a', 'b'], { total: 5, limit: 2, offset: 0 }, null);
    expect(page.nextOffset()).toBe(2);
  });

  it('nextOffset returns null when no more pages', () => {
    const page = new Page(['a', 'b'], { total: 2, limit: 2, offset: 0 }, null);
    expect(page.nextOffset()).toBeNull();
  });
});

describe('autoPaginate', () => {
  it('iterates through all pages', async () => {
    const allItems = ['a', 'b', 'c', 'd', 'e'];
    const pageSize = 2;

    const fetchPage = async (offset: number) => {
      const items = allItems.slice(offset, offset + pageSize);
      return new Page(items, {
        total: allItems.length,
        limit: pageSize,
        offset,
      }, null);
    };

    const results: string[] = [];
    for await (const item of autoPaginate(fetchPage)) {
      results.push(item);
    }

    expect(results).toEqual(allItems);
  });

  it('respects maxItems option', async () => {
    const allItems = ['a', 'b', 'c', 'd', 'e'];

    const fetchPage = async (offset: number) => {
      const items = allItems.slice(offset, offset + 2);
      return new Page(items, {
        total: allItems.length,
        limit: 2,
        offset,
      }, null);
    };

    const results: string[] = [];
    for await (const item of autoPaginate(fetchPage, { maxItems: 3 })) {
      results.push(item);
    }

    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('handles empty results', async () => {
    const fetchPage = async (_offset: number) => {
      return new Page<string>([], { total: 0, limit: 10, offset: 0 }, null);
    };

    const results: string[] = [];
    for await (const item of autoPaginate(fetchPage)) {
      results.push(item);
    }

    expect(results).toEqual([]);
  });

  it('handles single page', async () => {
    const fetchPage = async (_offset: number) => {
      return new Page(['a', 'b'], { total: 2, limit: 10, offset: 0 }, null);
    };

    const results: string[] = [];
    for await (const item of autoPaginate(fetchPage)) {
      results.push(item);
    }

    expect(results).toEqual(['a', 'b']);
  });
});
