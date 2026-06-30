import type { PaginatedResponse } from './api.models';

export interface CursorPageParams {
  cursor?: string;
  pageSize?: number;
}

export interface CollectCursorPagesOptions<T> {
  initialCursor?: string;
  pageSize?: number;
  maxPages?: number;
  stopWhen?: (context: {
    page: PaginatedResponse<T>;
    items: T[];
    pageCount: number;
  }) => boolean;
}

export async function collectCursorPages<T>(
  loadPage: (params: CursorPageParams) => Promise<PaginatedResponse<T>>,
  options: CollectCursorPagesOptions<T> = {},
): Promise<PaginatedResponse<T>> {
  const items: T[] = [];
  const maxPages = Math.max(1, options.maxPages ?? 500);
  let cursor = options.initialCursor;
  let nextCursor: string | null = null;

  for (let pageCount = 1; pageCount <= maxPages; pageCount += 1) {
    const page = await loadPage({ cursor, pageSize: options.pageSize });
    items.push(...page.items);
    nextCursor = page.nextCursor;

    if (options.stopWhen?.({ page, items, pageCount })) {
      break;
    }

    if (!page.nextCursor) {
      break;
    }

    cursor = page.nextCursor;
  }

  return { items, nextCursor };
}
