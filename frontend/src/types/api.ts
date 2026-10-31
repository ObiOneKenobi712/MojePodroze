// Typy odpowiedzi API – zgodne ze schematami backendu (backend/app/schemas).

export type TripStatus = "planned" | "in_progress" | "completed" | "archived";
export type TripType = "domestic" | "foreign";
export type Section = "flights" | "transport" | "meals" | "places" | "expenses";

export interface User {
  id: number;
  login: string;
}

export interface DictionaryEntry {
  id: number;
  code: string;
  name: string;
}

/** Wartość ze słownika z polską etykietą, np. {value: "foreign", label: "zagraniczna"} */
export interface LabeledValue<T extends string = string> {
  value: T;
  label: string;
}

export type PlaceKind = "accommodation" | "attraction";

/** GET /api/dictionaries (pola używane przez frontend) */
export interface Dictionaries {
  trip_characters: DictionaryEntry[];
  trip_types: LabeledValue<TripType>[];
  transport_means: DictionaryEntry[];
  expense_categories: DictionaryEntry[];
  place_kinds: LabeledValue<PlaceKind>[];
}

/** Dane formularza podróży: POST /api/trips, PUT /api/trips/{id} */
export interface TripInput {
  name: string;
  destination_city: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  trip_type: TripType;
  character_id: number;
  planned_budget: number | null;
}

export interface Trip {
  id: number;
  name: string;
  destination_city: string;
  destination_country: string;
  start_date: string; // RRRR-MM-DD
  end_date: string;
  trip_type: TripType;
  character: DictionaryEntry;
  status: TripStatus;
  planned_budget: number | null;
  status_label: string;
  trip_type_label: string;
  duration_days: number;
  allowed_transitions: TripStatus[];
  is_read_only: boolean;
  available_sections: Section[];
}

export interface Countdown {
  trip_id: number;
  trip_name: string;
  destination_city: string;
  start_date: string;
  days_left: number;
}

export interface Dashboard {
  trips: Record<TripStatus, Trip[]>;
  countdown: Countdown | null;
}

/** Zdjęcie podróży: GET /api/trips/{id}/photos */
export interface Photo {
  id: number;
  trip_id: number;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  day: string;
  caption: string | null;
  uploaded_at: string;
  file_url: string; // wymaga X-User-Id → api.getBlob
}

/** Dane formularza posiłku: POST/PUT /api/trips/{id}/meals */
export interface MealInput {
  dish: string;
  restaurant_name: string;
  meal_date: string; // RRRR-MM-DD
  cost: number;
  rating: number | null; // ocena restauracji 1–5
}

/** Posiłek: GET /api/trips/{id}/meals (posortowane po dacie) */
export interface Meal extends MealInput {
  id: number;
  trip_id: number;
  created_at: string;
}

/** Przejazd: GET /api/trips/{id}/transports (zapis: transport_mean_id zamiast obiektu) */
export interface Transport {
  id: number;
  trip_id: number;
  transport_mean: DictionaryEntry;
  route_from: string;
  route_to: string;
  travel_date: string;
  cost: number;
  rating: number | null;
  created_at: string;
}

/** Nocleg lub atrakcja: GET /api/trips/{id}/places */
export interface Place {
  id: number;
  trip_id: number;
  name: string;
  kind: PlaceKind;
  visit_date: string;
  cost: number;
  rating: number | null;
  note: string | null;
  created_at: string;
}

/** Punkt planu dnia: GET /api/trips/{id}/plan-points (posortowane po dniu i godzinie) */
export interface PlanPoint {
  id: number;
  trip_id: number;
  day: string; // RRRR-MM-DD, w terminie podróży (inaczej 422 DATE_OUTSIDE_TRIP)
  planned_time: string | null; // GG:MM:SS
  place: string;
  description: string | null;
}

/** Wpis pamiętnika: GET /api/trips/{id}/diary-entries (posortowane po dacie) */
export interface DiaryEntry {
  id: number;
  trip_id: number;
  entry_date: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

/** Lot (tylko podróż zagraniczna): GET /api/trips/{id}/flights; daty z godziną bez strefy */
export interface Flight {
  id: number;
  trip_id: number;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_at: string; // RRRR-MM-DDTGG:MM:SS
  arrival_at: string | null;
  cost: number;
  rating: number | null;
  created_at: string;
}

/** Wydatek inny (bez oceny): GET /api/trips/{id}/expenses */
export interface Expense {
  id: number;
  trip_id: number;
  category: DictionaryEntry;
  description: string;
  expense_date: string | null;
  cost: number;
  created_at: string;
}

/** Dzień albumu: GET /api/trips/{id}/album */
export interface AlbumDay {
  day: string; // RRRR-MM-DD
  photos: Photo[];
}

/** Suma jednej sekcji w kosztorysie */
export interface SectionSummary {
  section: Section;
  label: string; // polska nazwa sekcji
  total_cost: number;
  items_count: number;
  average_rating: number | null;
  rated_items_count: number;
}

/** no_budget – brak budżetu, ok, warning – wydano ≥ 90%, exceeded – ponad budżet */
export type BudgetAlertLevel = "no_budget" | "ok" | "warning" | "exceeded";

export interface Budget {
  planned_budget: number | null;
  spent: number;
  remaining: number | null;
  overrun: number | null;
  usage_percent: number | null;
  alert_level: BudgetAlertLevel;
}

/** GET /api/trips/{id}/cost-summary */
export interface CostSummary {
  trip_id: number;
  total_cost: number;
  average_rating: number | null;
  rated_items_count: number;
  trip_days: number;
  average_daily_cost: number;
  sections: SectionSummary[];
  budget: Budget;
}

export interface Recommendation {
  category: "restaurant" | "accommodation" | "attraction";
  name: string;
  average_rating: number;
  ratings_count: number;
  trip_ids: number[];
}

/** GET /api/trips/{id}/recommendations – z wcześniejszych podróży do tego samego miasta */
export interface Recommendations {
  destination_city: string;
  previous_trips: { id: number; name: string; start_date: string; end_date: string; status: TripStatus }[];
  restaurants: Recommendation[];
  places: Recommendation[];
  pending_wishlist: { name: string; trip_ids: number[] }[];
}

/** GET /api/stats – tylko podróże zrealizowane i w archiwum */
export interface Statistics {
  realized_trips_count: number;
  total_cost: number;
  average_trip_cost: number | null;
  average_daily_cost: number | null;
  trips_per_year: { year: number; trips_count: number }[];
  cost_by_character: {
    character: string;
    trips_count: number;
    total_cost: number;
    average_cost: number;
    average_daily_cost: number;
  }[];
}

export interface WeatherCity {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

/** Wynik wyszukiwania miasta: GET /api/weather/cities */
export interface CitySearchResult extends WeatherCity {
  region: string | null;
}

export interface CurrentWeather {
  temperature_c: number;
  apparent_temperature_c: number | null;
  relative_humidity: number | null;
  wind_speed_kmh: number | null;
  weather_code: number;
  description: string;
  is_day: boolean | null;
  observed_at: string;
}

/** GET /api/weather/current */
export interface WeatherResponse {
  city: WeatherCity;
  weather: CurrentWeather;
}

export interface ExchangeRate {
  code: string;
  currency: string;
  mid: number;
}

/** GET /api/exchange-rates */
export interface ExchangeRates {
  table_no: string;
  effective_date: string; // RRRR-MM-DD
  rates: ExchangeRate[];
}

/** GET /api/exchange-rates/convert */
export interface Conversion {
  amount: number;
  currency: string;
  rate: number;
  amount_pln: number;
  effective_date: string;
}
