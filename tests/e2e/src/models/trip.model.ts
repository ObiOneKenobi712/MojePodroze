import { TripCharacterId, TripType } from "@_src/enums/trip.enum";

export type TripStatus = "planned" | "in_progress" | "completed" | "archived";

export interface AddTripModel {
  name: string;
  destination_city: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  trip_type: TripType;
  character_id: TripCharacterId;
  planned_budget?: number | null;
}
