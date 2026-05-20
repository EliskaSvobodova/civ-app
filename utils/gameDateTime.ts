/** Local calendar date for HTML-style date inputs: YYYY-MM-DD */
export function isoToLocalDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local time for inputs: HH:MM (24-hour) */
export function isoToLocalTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function parseLocalDateTimeToIso(date: string, time: string): string {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();

  if (!DATE_PATTERN.test(trimmedDate)) {
    throw new Error('Enter a valid date (YYYY-MM-DD).');
  }
  if (!TIME_PATTERN.test(trimmedTime)) {
    throw new Error('Enter a valid time (HH:MM).');
  }

  const [year, month, day] = trimmedDate.split('-').map(Number);
  const [hours, minutes] = trimmedTime.split(':').map(Number);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error('Date or time is out of range.');
  }

  const parsed = new Date(year, month - 1, day, hours, minutes);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    throw new Error('Enter a valid date and time.');
  }

  return parsed.toISOString();
}
