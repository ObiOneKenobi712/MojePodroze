// Przepisy sekcji dla ItemSection: pola formularza (zgodne z backend/app/schemas/items.py i planning.py)
// i wygląd pozycji na liście. Nowa sekcja = nowy przepis tutaj + gałąź w TripDetailsPage.
import type { DiaryEntry, Expense, Flight, Meal, PlaceKind, Place, PlanPoint, Transport } from "../../types/api";
import type { SectionConfig } from "../../components/ItemSection/ItemSection";
import type { ChecklistConfig } from "../../components/ChecklistSection/ChecklistSection";
import { capitalize, formatDate, formatDateTime } from "../../utils/format";

const MAX_FLIGHT_HOURS = 48;

/** "2026-09-21T10:30" + 48 h → "2026-09-23T10:30" (czas lokalny bez strefy, liczony jak UTC – bez zmian czasu) */
function addHours(local: string, hours: number): string {
  const [date, time] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + hours, mm)).toISOString().slice(0, 16);
}

// Loty – zakładka tylko dla podróży zagranicznej (available_sections z API)
export const FLIGHTS: SectionConfig<Flight> = {
  path: "flights",
  title: "Loty",
  testId: { single: "flight", plural: "flights" },
  texts: {
    add: "Dodaj lot",
    new: "Nowy lot",
    edit: "Edytuj lot",
    remove: "Usuń lot",
    removeTitle: "Usunąć lot?",
    empty: "Nie dodano jeszcze żadnego lotu.",
    loading: "Wczytywanie lotów…",
    loadError: "Nie udało się wczytać lotów.",
    saveError: "Nie udało się zapisać lotu.",
    removeError: "Nie udało się usunąć lotu.",
  },
  fields: [
    { name: "flight_number", label: "Numer lotu", kind: "text", testKey: "number", required: true, requiredMessage: "Podaj numer lotu, np. LO 327.", minLength: 2, maxLength: 10 },
    { name: "departure_airport", label: "Lotnisko wylotu", kind: "text", testKey: "from", required: true, requiredMessage: "Podaj lotnisko wylotu.", maxLength: 100 },
    { name: "arrival_airport", label: "Lotnisko przylotu", kind: "text", testKey: "to", required: true, requiredMessage: "Podaj lotnisko przylotu.", maxLength: 100 },
    { name: "departure_at", label: "Wylot (data i godzina)", kind: "datetime", testKey: "departure", required: true, requiredMessage: "Podaj datę i godzinę wylotu." },
    // Przylot może wypaść po końcu podróży (lot nocny) – zakres od wylotu do wylotu + 48 h (limits)
    { name: "arrival_at", label: "Przylot (opcjonalnie)", kind: "datetime", testKey: "arrival", anyDate: true },
    { name: "cost", label: "Koszt (PLN)", kind: "money", testKey: "cost" },
    { name: "rating", label: "Ocena", kind: "rating", testKey: "rating" },
  ],
  // „Nie wcześniej niż wylot” jak w backendzie (FlightIn.check_times); limit 48 h tylko we frontendzie.
  // Format "RRRR-MM-DDTGG:MM" da się porównać jak tekst.
  validate: (v) => {
    const errors: Record<string, string> = {};
    if (v.departure_at && v.arrival_at) {
      if (v.arrival_at < v.departure_at) errors.arrival_at = "Przylot nie może być wcześniejszy niż wylot.";
      else if (v.arrival_at > addHours(v.departure_at, MAX_FLIGHT_HOURS))
        errors.arrival_at = `Przylot najpóźniej ${MAX_FLIGHT_HOURS} godziny po wylocie.`;
    }
    return errors;
  },
  limits: (v) => ({
    arrival_at: v.departure_at ? { min: v.departure_at, max: addHours(v.departure_at, MAX_FLIGHT_HOURS) } : {},
  }),
  itemTitle: (f) => `${f.departure_airport} → ${f.arrival_airport}`,
  itemMeta: (f) => [
    f.flight_number,
    `wylot ${formatDateTime(f.departure_at)}`,
    ...(f.arrival_at ? [`przylot ${formatDateTime(f.arrival_at)}`] : []),
  ],
  itemRating: (f) => f.rating,
  removeMessage: (f) => `Lot ${f.flight_number} (${f.departure_airport} → ${f.arrival_airport})`,
};

export const MEALS: SectionConfig<Meal> = {
  path: "meals",
  title: "Posiłki",
  testId: { single: "meal", plural: "meals" },
  texts: {
    add: "Dodaj posiłek",
    new: "Nowy posiłek",
    edit: "Edytuj posiłek",
    remove: "Usuń posiłek",
    removeTitle: "Usunąć posiłek?",
    empty: "Nie dodano jeszcze żadnego posiłku.",
    loading: "Wczytywanie posiłków…",
    loadError: "Nie udało się wczytać posiłków.",
    saveError: "Nie udało się zapisać posiłku.",
    removeError: "Nie udało się usunąć posiłku.",
  },
  fields: [
    { name: "dish", label: "Danie", kind: "text", testKey: "dish", required: true, requiredMessage: "Podaj, co było jedzone.", maxLength: 200 },
    { name: "restaurant_name", label: "Restauracja", kind: "text", testKey: "restaurant", required: true, requiredMessage: "Podaj nazwę restauracji.", maxLength: 150 },
    { name: "meal_date", label: "Data", kind: "date", testKey: "date", required: true, requiredMessage: "Podaj datę posiłku." },
    { name: "cost", label: "Koszt (PLN)", kind: "money", testKey: "cost" },
    { name: "rating", label: "Ocena restauracji", kind: "rating", testKey: "rating" },
  ],
  itemTitle: (m) => m.dish,
  itemMeta: (m) => [m.restaurant_name, formatDate(m.meal_date)],
  itemRating: (m) => m.rating,
  removeMessage: (m) => `„${m.dish}” (${m.restaurant_name}, ${formatDate(m.meal_date)})`,
};

export const TRANSPORTS: SectionConfig<Transport> = {
  path: "transports",
  title: "Transport",
  testId: { single: "transport", plural: "transports" },
  texts: {
    add: "Dodaj przejazd",
    new: "Nowy przejazd",
    edit: "Edytuj przejazd",
    remove: "Usuń przejazd",
    removeTitle: "Usunąć przejazd?",
    empty: "Nie dodano jeszcze żadnego przejazdu.",
    loading: "Wczytywanie przejazdów…",
    loadError: "Nie udało się wczytać przejazdów.",
    saveError: "Nie udało się zapisać przejazdu.",
    removeError: "Nie udało się usunąć przejazdu.",
  },
  fields: [
    {
      name: "transport_mean_id",
      label: "Środek transportu",
      kind: "select",
      testKey: "mean",
      required: true,
      requiredMessage: "Wybierz środek transportu.",
      numeric: true,
      options: (d) => d.transport_means.map((m) => ({ value: String(m.id), label: m.name })),
      fromItem: (t: Transport) => t.transport_mean.id,
    },
    { name: "travel_date", label: "Data", kind: "date", testKey: "date", required: true, requiredMessage: "Podaj datę przejazdu." },
    { name: "route_from", label: "Skąd", kind: "text", testKey: "from", required: true, requiredMessage: "Podaj miejsce wyjazdu.", maxLength: 100 },
    { name: "route_to", label: "Dokąd", kind: "text", testKey: "to", required: true, requiredMessage: "Podaj miejsce docelowe.", maxLength: 100 },
    { name: "cost", label: "Koszt (PLN)", kind: "money", testKey: "cost" },
    { name: "rating", label: "Ocena", kind: "rating", testKey: "rating" },
  ],
  itemTitle: (t) => `${t.route_from} → ${t.route_to}`,
  itemMeta: (t) => [t.transport_mean.name, formatDate(t.travel_date)],
  itemRating: (t) => t.rating,
  removeMessage: (t) => `Przejazd „${t.route_from} → ${t.route_to}” (${formatDate(t.travel_date)})`,
};

/** "2026-09-21" + 1 → "2026-09-22" */
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Etykiety rodzaju na liście (formularz bierze je ze słownika place_kinds)
const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  accommodation: "Nocleg",
  attraction: "Atrakcja",
};

export const PLACES: SectionConfig<Place> = {
  path: "places",
  title: "Noclegi i atrakcje",
  testId: { single: "place", plural: "places" },
  texts: {
    add: "Dodaj nocleg lub atrakcję",
    new: "Nowy nocleg lub atrakcja",
    edit: "Edytuj nocleg lub atrakcję",
    remove: "Usuń pozycję",
    removeTitle: "Usunąć pozycję?",
    empty: "Nie dodano jeszcze noclegów ani atrakcji.",
    loading: "Wczytywanie noclegów i atrakcji…",
    loadError: "Nie udało się wczytać noclegów i atrakcji.",
    saveError: "Nie udało się zapisać pozycji.",
    removeError: "Nie udało się usunąć pozycji.",
  },
  fields: [
    { name: "name", label: "Nazwa", kind: "text", testKey: "name", required: true, requiredMessage: "Podaj nazwę miejsca.", maxLength: 150 },
    {
      name: "kind",
      label: "Rodzaj",
      kind: "select",
      testKey: "kind",
      required: true,
      requiredMessage: "Wybierz rodzaj.",
      options: (d) => d.place_kinds.map((k) => ({ value: k.value, label: capitalize(k.label) })),
    },
    { name: "visit_date", label: "Data", kind: "date", testKey: "date", required: true, requiredMessage: "Podaj datę." },
    { name: "cost", label: "Koszt (PLN)", kind: "money", testKey: "cost" },
    { name: "rating", label: "Ocena", kind: "rating", testKey: "rating" },
    { name: "note", label: "Notatka (opcjonalnie)", kind: "textarea", testKey: "note", maxLength: 2000 },
  ],
  // Jeden nocleg na noc (atrakcji może być kilka) – tylko we frontendzie, backend tego nie sprawdza
  validate: (v, items, editingId) => {
    const errors: Record<string, string> = {};
    if (v.kind !== "accommodation" || !v.visit_date) return errors;
    const taken = items.find((p) => p.kind === "accommodation" && p.visit_date === v.visit_date && p.id !== editingId);
    if (taken)
      errors.visit_date = `Na ${formatDate(v.visit_date)} jest już nocleg „${taken.name}”. Wybierz inny dzień albo edytuj tamten nocleg.`;
    return errors;
  },
  // Kopia noclegu = zwykle kolejna noc w tym samym miejscu
  copyValues: (v) => (v.kind === "accommodation" && v.visit_date ? { ...v, visit_date: addDays(v.visit_date, 1) } : v),
  itemTitle: (p) => p.name,
  itemMeta: (p) => [PLACE_KIND_LABEL[p.kind], formatDate(p.visit_date)],
  itemRating: (p) => p.rating,
  itemNote: (p) => p.note,
  removeMessage: (p) => `„${p.name}” (${PLACE_KIND_LABEL[p.kind].toLowerCase()}, ${formatDate(p.visit_date)})`,
};

export const EXPENSES: SectionConfig<Expense> = {
  path: "expenses",
  title: "Wydatki inne",
  testId: { single: "expense", plural: "expenses" },
  texts: {
    add: "Dodaj wydatek",
    new: "Nowy wydatek",
    edit: "Edytuj wydatek",
    remove: "Usuń wydatek",
    removeTitle: "Usunąć wydatek?",
    empty: "Nie dodano jeszcze żadnych wydatków.",
    loading: "Wczytywanie wydatków…",
    loadError: "Nie udało się wczytać wydatków.",
    saveError: "Nie udało się zapisać wydatku.",
    removeError: "Nie udało się usunąć wydatku.",
  },
  // Bez oceny; data opcjonalna (np. ubezpieczenie kupione przed wyjazdem)
  fields: [
    { name: "description", label: "Opis", kind: "text", testKey: "description", required: true, requiredMessage: "Podaj, na co był wydatek.", maxLength: 255 },
    {
      name: "category_id",
      label: "Kategoria",
      kind: "select",
      testKey: "category",
      required: true,
      requiredMessage: "Wybierz kategorię.",
      numeric: true,
      options: (d) => d.expense_categories.map((c) => ({ value: String(c.id), label: c.name })),
      fromItem: (e: Expense) => e.category.id,
    },
    // Dowolna data – np. ubezpieczenie albo bilety kupione przed wyjazdem
    { name: "expense_date", label: "Data (opcjonalnie)", kind: "date", testKey: "date", anyDate: true },
    { name: "cost", label: "Kwota (PLN)", kind: "money", testKey: "cost" },
  ],
  itemTitle: (e) => e.description,
  itemMeta: (e) => [e.category.name, e.expense_date ? formatDate(e.expense_date) : "bez daty"],
  removeMessage: (e) => `„${e.description}” (${e.category.name})`,
};

// Plan dnia – bez kosztu; lista według dni, w dniu według godziny (sortuje backend)
export const PLAN: SectionConfig<PlanPoint> = {
  path: "plan-points",
  title: "Plan dnia",
  testId: { single: "plan-point", plural: "plan-points" },
  texts: {
    add: "Dodaj punkt planu",
    new: "Nowy punkt planu",
    edit: "Edytuj punkt planu",
    remove: "Usuń punkt",
    removeTitle: "Usunąć punkt planu?",
    empty: "Plan jest pusty. Dodaj pierwszy punkt – miejsce i dzień, a godzinę, jeśli ją znasz.",
    loading: "Wczytywanie planu…",
    loadError: "Nie udało się wczytać planu.",
    saveError: "Nie udało się zapisać punktu planu.",
    removeError: "Nie udało się usunąć punktu planu.",
  },
  fields: [
    { name: "place", label: "Miejsce", kind: "text", testKey: "place", required: true, requiredMessage: "Podaj miejsce.", maxLength: 150 },
    { name: "day", label: "Dzień", kind: "date", testKey: "day", required: true, requiredMessage: "Wybierz dzień." },
    { name: "planned_time", label: "Godzina (opcjonalnie)", kind: "time", testKey: "time" },
    { name: "description", label: "Opis (opcjonalnie)", kind: "textarea", testKey: "description", maxLength: 2000 },
  ],
  itemTitle: (p) => p.place,
  itemMeta: (p) => [p.planned_time ? p.planned_time.slice(0, 5) : "bez godziny"],
  itemNote: (p) => p.description,
  removeMessage: (p) => `„${p.place}” (${formatDate(p.day)})`,
  groupByDay: (p) => p.day,
};

// Pamiętnik – wpisy według dni; tytuł opcjonalny, treść z zachowanymi akapitami
export const DIARY: SectionConfig<DiaryEntry> = {
  path: "diary-entries",
  title: "Pamiętnik",
  testId: { single: "diary-entry", plural: "diary-entries" },
  texts: {
    add: "Dodaj wpis",
    new: "Nowy wpis",
    edit: "Edytuj wpis",
    remove: "Usuń wpis",
    removeTitle: "Usunąć wpis?",
    empty: "Pamiętnik jest pusty. Zapisz pierwsze wrażenia z podróży.",
    loading: "Wczytywanie pamiętnika…",
    loadError: "Nie udało się wczytać pamiętnika.",
    saveError: "Nie udało się zapisać wpisu.",
    removeError: "Nie udało się usunąć wpisu.",
  },
  fields: [
    { name: "entry_date", label: "Dzień", kind: "date", testKey: "date", required: true, requiredMessage: "Wybierz dzień." },
    { name: "title", label: "Tytuł (opcjonalnie)", kind: "text", testKey: "title", maxLength: 150 },
    { name: "content", label: "Treść", kind: "textarea", testKey: "content", required: true, requiredMessage: "Napisz treść wpisu.", maxLength: 10000, rows: 8 },
  ],
  itemTitle: (e) => e.title ?? "",
  itemMeta: () => [],
  itemNote: (e) => e.content,
  noteIsBody: true,
  removeMessage: (e) => (e.title ? `Wpis „${e.title}” (${formatDate(e.entry_date)})` : `Wpis z ${formatDate(e.entry_date)}`),
  groupByDay: (e) => e.entry_date,
};

// Listy do odhaczania (ChecklistSection); „Zaliczone: 2 z 5” – bez odmiany liczebników
export const WISHLIST: ChecklistConfig = {
  path: "wishlist",
  title: "Chcę odwiedzić",
  checkKey: "visited",
  hasNote: true,
  testId: { single: "wishlist-item", plural: "wishlist" },
  texts: {
    nameLabel: "Miejsce",
    add: "Dodaj",
    empty: "Lista jest pusta. Dopisz miejsca, które chcesz zobaczyć – odhaczysz je na miejscu.",
    progress: (done, total) => `Zaliczone: ${done} z ${total}`,
    loading: "Wczytywanie listy…",
    loadError: "Nie udało się wczytać listy.",
    removeTitle: "Usunąć miejsce?",
    remove: "Usuń miejsce",
  },
};

// Zagraniczna podróż dostaje od backendu domyślną listę (is_default), np. paszport
export const PACKING: ChecklistConfig = {
  path: "packing-items",
  title: "Lista pakowania",
  checkKey: "packed",
  hasNote: false,
  testId: { single: "packing-item", plural: "packing" },
  texts: {
    nameLabel: "Rzecz do spakowania",
    add: "Dodaj",
    empty: "Lista pakowania jest pusta. Dopisz pierwszą rzecz.",
    progress: (done, total) => `Spakowane: ${done} z ${total}`,
    loading: "Wczytywanie listy pakowania…",
    loadError: "Nie udało się wczytać listy pakowania.",
    removeTitle: "Usunąć z listy?",
    remove: "Usuń z listy",
  },
};
