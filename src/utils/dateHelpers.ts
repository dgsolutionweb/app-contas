import {
  format,
  addDays,
  addMonths,
  isValid,
  parse,
  startOfDay,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
} from 'date-fns';

/**
 * Normalizes various date input formats to ISO 'YYYY-MM-DD'.
 * Returns null if the input cannot be parsed.
 */
export function parseDate(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const today = startOfDay(new Date());

  // Relative keywords
  if (trimmed === 'hoje') return format(today, 'yyyy-MM-dd');
  if (trimmed === 'amanha' || trimmed === 'amanhã') {
    return format(addDays(today, 1), 'yyyy-MM-dd');
  }
  if (trimmed === 'depois de amanha' || trimmed === 'depois de amanhã') {
    return format(addDays(today, 2), 'yyyy-MM-dd');
  }

  // Day of week
  const weekdayMap: Record<string, (date: Date) => Date> = {
    'segunda': nextMonday,
    'terca': nextTuesday,
    'terça': nextTuesday,
    'quarta': nextWednesday,
    'quinta': nextThursday,
    'sexta': nextFriday,
    'sabado': nextSaturday,
    'sábado': nextSaturday,
    'domingo': nextSunday,
  };
  for (const [key, fn] of Object.entries(weekdayMap)) {
    if (trimmed.includes(key)) return format(fn(today), 'yyyy-MM-dd');
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const fullMatch = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (fullMatch) {
    const day = parseInt(fullMatch[1]);
    const month = parseInt(fullMatch[2]);
    let year = parseInt(fullMatch[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    if (isValid(d) && d.getMonth() === month - 1) {
      return format(d, 'yyyy-MM-dd');
    }
  }

  // DD/MM or DD-MM (infer year)
  const shortMatch = input.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (shortMatch) {
    const day = parseInt(shortMatch[1]);
    const month = parseInt(shortMatch[2]);
    let year = today.getFullYear();
    let d = new Date(year, month - 1, day);
    // If the date is in the past (more than 1 day ago), bump to next year
    if (d < addDays(today, -1)) {
      d = new Date(year + 1, month - 1, day);
    }
    if (isValid(d) && d.getMonth() === month - 1) {
      return format(d, 'yyyy-MM-dd');
    }
  }

  // "dia 15" or bare day of month (infer current/next month)
  const dayOnlyMatch = input.match(/^(?:dia\s+)?(\d{1,2})$/i);
  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    let year = today.getFullYear();
    let month = today.getMonth();
    let d = new Date(year, month, day);

    if (!isValid(d) || d.getDate() !== day) {
      return null;
    }

    if (d < today) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      d = new Date(year, month, day);
      if (!isValid(d) || d.getDate() !== day) {
        return null;
      }
    }

    return format(d, 'yyyy-MM-dd');
  }

  // Try ISO format directly
  try {
    const d = parse(input, 'yyyy-MM-dd', new Date());
    if (isValid(d)) return format(d, 'yyyy-MM-dd');
  } catch {
    // ignore
  }

  return null;
}

/**
 * Returns current month as 'YYYY-MM'.
 */
export function currentYearMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Parses a month mention from text like "abril", "março", "próximo mês".
 * Returns 'YYYY-MM' string or current month as fallback.
 */
export function parseYearMonth(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('proximo mes') || lower.includes('próximo mês')) {
    return format(addMonths(new Date(), 1), 'yyyy-MM');
  }

  const months: Record<string, number> = {
    janeiro: 1, fevereiro: 2, marco: 3, março: 3,
    abril: 4, maio: 5, junho: 6, julho: 7,
    agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  };

  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) {
      const year = new Date().getFullYear();
      return `${year}-${String(num).padStart(2, '0')}`;
    }
  }

  return currentYearMonth();
}

/**
 * Formats an ISO date string to 'dd/MM/yyyy' for display.
 */
export function formatDisplayDate(isoDate: string): string {
  try {
    const d = parse(isoDate, 'yyyy-MM-dd', new Date());
    return format(d, 'dd/MM/yyyy');
  } catch {
    return isoDate;
  }
}

/**
 * Returns the default due date based on a configured day of month.
 * If the day has already passed this month, returns the same day next month.
 */
export function getDefaultDueDate(dayOfMonth: number): string {
  const today = startOfDay(new Date());
  const normalizedDay = Math.min(Math.max(Math.trunc(dayOfMonth), 1), 31);

  const buildCandidate = (year: number, month: number) => {
    const candidate = new Date(year, month, normalizedDay);

    // Clamp 29/30/31 to the last valid day of shorter months.
    if (candidate.getMonth() !== month) {
      return new Date(year, month + 1, 0);
    }

    return candidate;
  };

  let year = today.getFullYear();
  let month = today.getMonth();
  let candidate = buildCandidate(year, month);

  if (candidate < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidate = buildCandidate(year, month);
  }

  return format(candidate, 'yyyy-MM-dd');
}

/**
 * Adds a specific number of months to an ISO date string (YYYY-MM-DD).
 */
export function addMonthsToISO(isoDate: string, months: number): string {
  try {
    const d = parse(isoDate, 'yyyy-MM-dd', new Date());
    return format(addMonths(d, months), 'yyyy-MM-dd');
  } catch {
    return isoDate;
  }
}
