/** "2026-11-12" → "12.11.2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

/** "2026-09-21T10:30:00" → "21.09.2026, 10:30" */
export function formatDateTime(iso: string): string {
  const [date, time = ""] = iso.split("T");
  return `${formatDate(date)}, ${time.slice(0, 5)}`;
}

/** "2026-09-21" → "poniedziałek" */
export function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pl-PL", { weekday: "long", timeZone: "UTC" });
}

/** Numer dnia podróży: 1 = dzień startu; null, gdy data jest poza terminem */
export function tripDayNumber(day: string, startDate: string, endDate: string): number | null {
  if (day < startDate || day > endDate) return null;
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(day) - toUtc(startDate)) / 86_400_000) + 1;
}

/** Kwota w złotych, np. 427 → "427,00 zł" */
export function formatPln(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
}

/** Liczba z jednym miejscem po przecinku, np. 4.333 → "4,3", 89.64 → "89,6" */
export function formatDecimal(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

/** Kurs waluty, np. 4.27 → "4,27" */
export function formatRate(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** Tekst odliczania: "Za 25 dni: Rzym", "Jutro: Rzym", "Dziś: Rzym" */
export function countdownText(daysLeft: number, city: string): string {
  if (daysLeft <= 0) return `Dziś: ${city}`;
  if (daysLeft === 1) return `Jutro: ${city}`;
  return `Za ${daysLeft} dni: ${city}`;
}

/** Wielka litera na początku: "w planie" → "W planie" */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
