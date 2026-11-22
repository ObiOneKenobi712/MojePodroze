import { TripSectionTab } from "@_src/enums/trip.enum";

export const foreignTripSectionTabs: string[] = [
  TripSectionTab.Overview,
  TripSectionTab.Plan,
  TripSectionTab.Flights,
  TripSectionTab.Transport,
  TripSectionTab.Meals,
  TripSectionTab.Places,
  TripSectionTab.Expenses,
  TripSectionTab.Wishlist,
  TripSectionTab.Packing,
  TripSectionTab.Diary,
  TripSectionTab.Costs,
];

export const domesticTripSectionTabs: string[] = foreignTripSectionTabs.filter((tab) => tab !== TripSectionTab.Flights);

export const defaultPackingItems: string[] = [
  "Paszport lub dowód osobisty",
  "Ubezpieczenie podróżne",
  "Przejściówka do gniazdka",
];
