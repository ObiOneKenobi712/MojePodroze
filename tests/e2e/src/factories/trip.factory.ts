import { AddTripModel } from "@_src/models/trip.model";

function getUniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function prepareTrip(tripData: AddTripModel): AddTripModel {
  return { ...tripData, name: `${tripData.name}-${getUniqueSuffix()}` };
}

export function prepareUniqueCity(city: string): string {
  return `${city}-${getUniqueSuffix()}`;
}
