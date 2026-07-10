/**
 * All app-facing dates/times (logs, "today" calculations, report labels,
 * bot command output) must be in IST (Asia/Kolkata), regardless of the
 * container's system timezone. IST has a fixed +5:30 offset with no DST,
 * so date arithmetic is done via a constant offset rather than relying on
 * environment timezone configuration (which is also set in index.ts as a
 * belt-and-suspenders measure for any stray unconverted Date usage).
 */
export const IST_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Returns the current instant shifted so UTC getters read as IST wall-clock values. */
function shiftToIST(d: Date): Date {
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/** "YYYY-MM-DD" for the given instant, in IST. */
export function istDateString(d: Date = new Date()): string {
  const shifted = shiftToIST(d);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable date+time label in IST, e.g. "9 Jul 2026, 6:45 pm". */
export function istDateTimeLabel(d: Date = new Date()): string {
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Human-readable date label in IST, e.g. "9 Jul 2026". */
export function istDateLabel(d: Date = new Date()): string {
  return d.toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE, day: "numeric", month: "short", year: "numeric" });
}

/** The Date instant corresponding to IST midnight, `daysAgo` days before today. */
export function startOfDayIST(daysAgo = 0): Date {
  const shifted = shiftToIST(new Date());
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - daysAgo);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/** The Date instant corresponding to IST end-of-day (23:59:59.999) for a given "YYYY-MM-DD" IST date string. */
export function endOfDayIST(dateStr: string): Date {
  const start = startOfDayForDateStringIST(dateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** The Date instant corresponding to IST midnight for a given "YYYY-MM-DD" IST date string. */
export function startOfDayForDateStringIST(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Construct the UTC instant that represents y-m-d 00:00 IST.
  const utcMidnightForDate = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  return new Date(utcMidnightForDate - IST_OFFSET_MS);
}

/** Milliseconds until the next occurrence of 23:59 IST (today if not yet passed, else tomorrow). */
export function msUntilNext2359IST(): { delayMs: number; nextRun: Date } {
  const now = new Date();
  const shiftedNow = shiftToIST(now);
  const nextShifted = new Date(shiftedNow);
  nextShifted.setUTCHours(23, 59, 0, 0);
  if (nextShifted <= shiftedNow) nextShifted.setUTCDate(nextShifted.getUTCDate() + 1);
  const nextRun = new Date(nextShifted.getTime() - IST_OFFSET_MS);
  return { delayMs: nextRun.getTime() - now.getTime(), nextRun };
}
