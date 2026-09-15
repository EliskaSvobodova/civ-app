import { describe, expect, it } from 'vitest';

import {
  gameDurationDays,
  isoToLocalDateInput,
  isoToLocalTimeInput,
  parseLocalDateTimeToIso,
  parseLocalDateToIso,
  todayLocalDateInput,
} from '@/utils/gameDateTime';

function localIso(year: number, monthIndex: number, day: number, hours = 12, minutes = 0): string {
  return new Date(year, monthIndex, day, hours, minutes).toISOString();
}

describe('gameDurationDays', () => {
  it('counts the same local calendar day as 1', () => {
    expect(gameDurationDays(localIso(2024, 0, 1, 1), localIso(2024, 0, 1, 23))).toBe(1);
  });

  it('counts inclusive calendar days across midnight', () => {
    expect(gameDurationDays(localIso(2024, 0, 1), localIso(2024, 0, 2))).toBe(2);
  });

  it('returns 1 for invalid timestamps', () => {
    expect(gameDurationDays('not-a-date', localIso(2024, 0, 1))).toBe(1);
    expect(gameDurationDays(localIso(2024, 0, 1), 'nope')).toBe(1);
  });
});

describe('iso local input helpers', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(isoToLocalDateInput(localIso(2024, 5, 9, 15, 30))).toBe('2024-06-09');
  });

  it('formats a local time as HH:MM', () => {
    expect(isoToLocalTimeInput(localIso(2024, 5, 9, 15, 5))).toBe('15:05');
  });

  it('returns empty strings for invalid ISO values', () => {
    expect(isoToLocalDateInput('bad')).toBe('');
    expect(isoToLocalTimeInput('bad')).toBe('');
  });

  it('returns today as YYYY-MM-DD', () => {
    expect(todayLocalDateInput()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseLocalDateToIso', () => {
  it('round-trips a valid local date', () => {
    const iso = parseLocalDateToIso('2024-02-29');
    expect(isoToLocalDateInput(iso)).toBe('2024-02-29');
  });

  it('preserves time from an existing ISO value', () => {
    const existing = localIso(2024, 0, 1, 18, 45);
    const iso = parseLocalDateToIso('2024-03-10', existing);
    expect(isoToLocalDateInput(iso)).toBe('2024-03-10');
    expect(isoToLocalTimeInput(iso)).toBe('18:45');
  });

  it('rejects invalid formats and impossible dates', () => {
    expect(() => parseLocalDateToIso('2024/01/01')).toThrow('Enter a valid date (YYYY-MM-DD).');
    expect(() => parseLocalDateToIso('2024-13-01')).toThrow('Date is out of range.');
    expect(() => parseLocalDateToIso('2024-02-31')).toThrow('Enter a valid date.');
  });
});

describe('parseLocalDateTimeToIso', () => {
  it('round-trips a valid local date and time', () => {
    const iso = parseLocalDateTimeToIso('2024-07-04', '09:15');
    expect(isoToLocalDateInput(iso)).toBe('2024-07-04');
    expect(isoToLocalTimeInput(iso)).toBe('09:15');
  });

  it('rejects invalid date or time', () => {
    expect(() => parseLocalDateTimeToIso('07-04-2024', '09:15')).toThrow(
      'Enter a valid date (YYYY-MM-DD).',
    );
    expect(() => parseLocalDateTimeToIso('2024-07-04', '9:15')).toThrow(
      'Enter a valid time (HH:MM).',
    );
    expect(() => parseLocalDateTimeToIso('2024-07-04', '24:00')).toThrow(
      'Date or time is out of range.',
    );
    expect(() => parseLocalDateTimeToIso('2024-02-31', '09:15')).toThrow(
      'Enter a valid date and time.',
    );
  });
});
