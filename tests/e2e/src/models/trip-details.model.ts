import { TripCardModel } from "@_src/models/trip-card.model";

export interface TripDetailsModel extends TripCardModel {
  destination: string;
  period: string;
  duration: string;
  budget: string;
}
