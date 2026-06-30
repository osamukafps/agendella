import { HttpErrorResponse } from '@angular/common/http';
import type { ErrorResponse } from './api.models';

export interface ApiErrorUiModel {
  status: number;
  code: string | null;
  message: string;
  fieldErrors: Record<string, string[]>;
  details: unknown;
}

const NON_FIELD_DETAIL_KEYS = new Set([
  'conflictType',
  'blockStart',
  'blockEnd',
  'resourceId',
  'resourceName',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
}

function extractFieldErrors(details: unknown): Record<string, string[]> {
  if (!isRecord(details)) {
    return {};
  }

  const fieldErrors: Record<string, string[]> = {};

  Object.entries(details).forEach(([key, value]) => {
    if (NON_FIELD_DETAIL_KEYS.has(key)) {
      return;
    }

    const messages = toStringArray(value);
    if (messages.length > 0) {
      fieldErrors[key] = messages;
    }
  });

  return fieldErrors;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value)
    && typeof value['message'] === 'string'
    && typeof value['code'] === 'string';
}

export function mapApiErrorToUi(
  error: unknown,
  fallbackMessage = 'Não foi possível concluir a operação.',
): ApiErrorUiModel {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: null,
      message: fallbackMessage,
      fieldErrors: {},
      details: null,
    };
  }

  const payload = isErrorResponse(error.error) ? error.error : null;
  const details = payload?.details ?? null;

  return {
    status: error.status,
    code: payload?.code ?? null,
    message: payload?.message ?? fallbackMessage,
    fieldErrors: extractFieldErrors(details),
    details,
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Não foi possível concluir a operação.',
): string {
  return mapApiErrorToUi(error, fallbackMessage).message;
}
