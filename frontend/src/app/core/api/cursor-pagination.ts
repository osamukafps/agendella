import { signal, type WritableSignal } from '@angular/core';
import type { PaginatedResponse } from './api.models';
import { getApiErrorMessage } from './api-error.utils';

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

export interface CursorPaginationState<T> {
  items: WritableSignal<T[]>;
  nextCursor: WritableSignal<string | null>;
  isLoading: WritableSignal<boolean>;
  isLoadingMore: WritableSignal<boolean>;
  initialError: WritableSignal<string | null>;
  loadMoreError: WritableSignal<string | null>;
}

export interface LoadCursorPageOptions<T> {
  state: CursorPaginationState<T>;
  loadPage: (params: CursorPageParams) => Promise<PaginatedResponse<T>>;
  reset?: boolean;
  pageSize?: number;
  fallbackMessage?: string;
  mergeItems?: (current: T[], incoming: T[]) => T[];
  selectItems?: (items: T[]) => T[];
}

export function createCursorPaginationState<T>(): CursorPaginationState<T> {
  return {
    items: signal<T[]>([]),
    nextCursor: signal<string | null>(null),
    isLoading: signal(false),
    isLoadingMore: signal(false),
    initialError: signal<string | null>(null),
    loadMoreError: signal<string | null>(null),
  };
}

export function mergeCursorItemsById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map(item => [item.id, item]));
  incoming.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

export async function loadCursorPage<T>(
  options: LoadCursorPageOptions<T>,
): Promise<PaginatedResponse<T>> {
  const {
    state,
    loadPage,
    reset = false,
    pageSize,
    fallbackMessage = 'Não foi possível carregar a lista.',
    mergeItems = (current, incoming) => [...current, ...incoming],
    selectItems = items => items,
  } = options;

  if (!reset && !state.nextCursor()) {
    return {
      items: state.items(),
      nextCursor: state.nextCursor(),
    };
  }

  if (reset) {
    state.isLoading.set(true);
    state.initialError.set(null);
  } else {
    state.isLoadingMore.set(true);
    state.loadMoreError.set(null);
  }

  try {
    const response = await loadPage({
      cursor: reset ? undefined : (state.nextCursor() ?? undefined),
      pageSize,
    });
    const nextItems = selectItems(response.items);

    state.items.set(
      reset
        ? nextItems
        : mergeItems(state.items(), nextItems),
    );
    state.nextCursor.set(response.nextCursor);
    return response;
  } catch (error) {
    const message = getApiErrorMessage(error, fallbackMessage);
    if (reset) {
      state.initialError.set(message);
    } else {
      state.loadMoreError.set(message);
    }
    throw error;
  } finally {
    if (reset) {
      state.isLoading.set(false);
    } else {
      state.isLoadingMore.set(false);
    }
  }
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
