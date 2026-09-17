import type { DateWindow, UtcTimestamp } from "../../contracts/v2";

export function isUtcTimestamp(value: string): value is UtcTimestamp {
  return value.endsWith("Z") && !Number.isNaN(Date.parse(value));
}

export function isValidHalfOpenWindow(window: DateWindow): boolean {
  return (
    window.boundary === "[start,end)" &&
    isUtcTimestamp(window.startAt) &&
    isUtcTimestamp(window.endAt) &&
    Date.parse(window.startAt) < Date.parse(window.endAt)
  );
}
