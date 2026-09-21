export const displayDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
export const displayDateRange = (startAt: string, endAt: string) => `${displayDate(startAt)} – before ${displayDate(endAt)}`;
export const displayNumber = (value: number | null) => value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
