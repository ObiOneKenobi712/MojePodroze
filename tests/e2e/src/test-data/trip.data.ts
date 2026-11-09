import { TripCharacterId, TripType } from "@_src/enums/trip.enum";
import { AddTripModel } from "@_src/models/trip.model";
import { getIsoDateFromToday } from "@_src/utils/date.util";

export const plannedTripData: AddTripModel = {
  name: "Podróż planowana",
  destination_city: "Gdańsk",
  destination_country: "Polska",
  start_date: getIsoDateFromToday(30),
  end_date: getIsoDateFromToday(33),
  trip_type: TripType.Domestic,
  character_id: TripCharacterId.City,
};

export const inProgressTripData: AddTripModel = {
  name: "Podróż w trakcie",
  destination_city: "Zakopane",
  destination_country: "Polska",
  start_date: getIsoDateFromToday(-1),
  end_date: getIsoDateFromToday(3),
  trip_type: TripType.Domestic,
  character_id: TripCharacterId.Mountains,
};

export const completedTripData: AddTripModel = {
  name: "Podróż zrealizowana",
  destination_city: "Lizbona",
  destination_country: "Portugalia",
  start_date: getIsoDateFromToday(-10),
  end_date: getIsoDateFromToday(-5),
  trip_type: TripType.Foreign,
  character_id: TripCharacterId.City,
};
