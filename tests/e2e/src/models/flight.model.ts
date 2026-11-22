export interface AddFlightModel {
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_at: string;
  arrival_at?: string | null;
  cost: number;
  rating?: number | null;
}
