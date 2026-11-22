import { AddFlightModel } from "@_src/models/flight.model";
import { AddTripModel } from "@_src/models/trip.model";

export function prepareFlight(trip: AddTripModel): AddFlightModel {
  return {
    flight_number: "LO 327",
    departure_airport: "Warszawa (WAW)",
    arrival_airport: "Rzym (FCO)",
    departure_at: `${trip.start_date}T08:00:00`,
    cost: 850,
  };
}
