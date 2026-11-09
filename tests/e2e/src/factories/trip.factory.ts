import { AddTripModel } from "@_src/models/trip.model";

export function prepareTrip(tripData: AddTripModel): AddTripModel {
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);

  return { ...tripData, name: `${tripData.name}-${uniqueSuffix}` };
}
