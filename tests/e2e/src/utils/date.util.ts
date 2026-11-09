import { addDays, differenceInCalendarDays, format, parse } from "date-fns";

export function getIsoDateFromToday(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

export function parseCardDate(date: string): Date {
  return parse(date, "dd.MM.yyyy", new Date());
}

export function getDaysUntil(date: string): number {
  return differenceInCalendarDays(parseCardDate(date), new Date());
}

export function getExpectedCountdownText(daysLeft: number): string {
  if (daysLeft === 0) {
    return "Dziś";
  }

  if (daysLeft === 1) {
    return "Jutro";
  }

  return `Za ${daysLeft} dni`;
}
