/** The date Corpsdle's puzzle numbering starts counting from day 1. */
const LAUNCH_DATE_KEY = '2026-07-23';

/** Today's calendar date in the browser's local time zone, as YYYY-MM-DD. */
export function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getGameNumber(todayKey: string): number {
  const msPerDay = 1000 * 3600 * 24;
  const timeDifference = Date.parse(todayKey) - Date.parse(LAUNCH_DATE_KEY);
  const dayDifference = timeDifference / msPerDay;

  return Math.round(dayDifference) + 1;
}

/**
 * Integer avalanche hash (Chris Wellons' "triple32") seeded by the day number.
 * Unlike hashing the date string directly, this scatters consecutive days across
 * the whole pool instead of walking sequentially through it.
 *
 * Done so that it doesn't just select shows in a sequential order
 */
export function mixIndex(seed: number, length: number): number {
  let x = seed >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x % length;
}
