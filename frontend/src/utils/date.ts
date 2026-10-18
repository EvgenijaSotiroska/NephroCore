import { MK_MONTHS, MK_MONTHS_SHORT, MK_WEEKDAYS } from "../constants";

const pad = (n: number) => String(n).padStart(2, "0");

export function toDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr);
}

export function toDateKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayIso = () => toDateKey(new Date());

export function formatLongDate(dateStr: string): string {
  const d = toDate(dateStr);
  return `${d.getDate()} ${MK_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatWeekdayDayMonth(dateStr: string): string {
  const d = toDate(dateStr);
  return `${MK_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MK_MONTHS[d.getMonth()]}`;
}

export function formatShortMonth(dateStr: string): string {
  return MK_MONTHS_SHORT[toDate(dateStr).getMonth()];
}

export function formatWeekday(dateStr: string): string {
  return MK_WEEKDAYS[toDate(dateStr).getDay()];
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function daysUntil(iso: string): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = toDate(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export const nowTime = () => formatTime(new Date().toISOString());

export function formatDayMonth(dateStr: string): string {
  const d = toDate(dateStr);
  return `${d.getDate()} ${MK_MONTHS_SHORT[d.getMonth()]}`;
}

export function formatTodayLong(): string {
  const text = formatWeekdayDayMonth(todayIso());
  return text.charAt(0).toUpperCase() + text.slice(1);
}