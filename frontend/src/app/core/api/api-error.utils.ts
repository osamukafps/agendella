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

function toCamelCaseSegment(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function normalizeFieldPath(path: string): string {
  return path
    .split('.')
    .map(segment => {
      const match = /^([^[\]]+)(.*)$/.exec(segment);
      if (!match) {
        return segment;
      }

      const [, propertyName, suffix] = match;
      return `${toCamelCaseSegment(propertyName)}${suffix}`;
    })
    .join('.');
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
      const normalizedKey = normalizeFieldPath(key);
      fieldErrors[normalizedKey] = [
        ...(fieldErrors[normalizedKey] ?? []),
        ...messages,
      ];
    }
  });

  return fieldErrors;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value)
    && typeof value['message'] === 'string'
    && typeof value['code'] === 'string';
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 0:
      return 'Não foi possível se comunicar com o servidor.';
    case 403:
      return 'Você não tem permissão para executar esta ação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'A operação não pôde ser concluída por conflito de dados.';
    case 422:
      return 'A operação não pôde ser concluída com os dados informados.';
    default:
      return 'Não foi possível concluir a operação.';
  }
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
  const inferredMessage = defaultMessageForStatus(error.status);
  const message = payload?.message
    ?? (error.status > 0 ? inferredMessage : fallbackMessage);

  return {
    status: error.status,
    code: payload?.code ?? null,
    message: message === 'Não foi possível concluir a operação.'
      ? fallbackMessage
      : message,
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
