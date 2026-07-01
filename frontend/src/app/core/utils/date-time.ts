export interface LocalDateTimeParts {
  date: string;
  time: string;
}

export const TIME_PICKER_HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0')
);

export const TIME_PICKER_MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0')
);

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || month < 1 || month > 12 || day < 1) {
    return false;
  }

  return day <= getDaysInMonth(year, month);
}

export function formatDateForDisplay(value: string): string {
  if (!isValidIsoDate(value)) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidTimeValue(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function formatTimeFromParts(hours: string, minutes: string): string {
  return `${hours}:${minutes}`;
}

export function utcToLocalDateTimeParts(utc: string): LocalDateTimeParts {
  if (!utc) {
    return { date: '', time: '' };
  }

  const date = new Date(utc);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export function localDateTimeToUtc(date: string, time: string): string | null {
  if (!isValidIsoDate(date) || !isValidTimeValue(time)) {
    return null;
  }

  const result = new Date(`${date}T${time}`);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}
