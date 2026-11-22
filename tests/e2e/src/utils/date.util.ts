import { addDays, differenceInCalendarDays, format, parse, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

export function getIsoDateFromToday(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

export function parseCardDate(date: string): Date {
  return parse(date, "dd.MM.yyyy", new Date());
}

export function formatTripCardDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd.MM.yyyy");
}

export function addDaysToDate(isoDate: string, days: number): string {
  return format(addDays(parseISO(isoDate), days), "yyyy-MM-dd");
}

export function getTripDayDate(tripStartDate: string, dayNumber: number): string {
  return addDaysToDate(tripStartDate, dayNumber - 1);
}

export function formatTripDateRange(fromDate: string, toDate: string): string {
  if (fromDate.slice(0, 4) !== toDate.slice(0, 4)) {
    return `${formatTripCardDate(fromDate)} – ${formatTripCardDate(toDate)}`;
  }

  return `${format(parseISO(fromDate), "dd.MM")}–${formatTripCardDate(toDate)}`;
}

export function getExpectedDayHeading(dayNumber: number, isoDate: string): string {
  const weekday = format(parseISO(isoDate), "EEEE", { locale: pl });
  return `Dzień ${dayNumber} · ${weekday}, ${formatTripCardDate(isoDate)}`;
}

export function getExpectedAlbumDayHeading(dayNumber: number, isoDate: string): string {
  return `Dzień ${dayNumber} · ${formatTripCardDate(isoDate)}`;
}

export function getTripDurationDays(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
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
