import { TRIP_CHARACTER_LABELS, TRIP_TYPE_LABELS, TripCharacterId, TripType } from "@_src/enums/trip.enum";

export const tripTypeOptions: string[] = [TRIP_TYPE_LABELS[TripType.Domestic], TRIP_TYPE_LABELS[TripType.Foreign]];

export const tripCharacterOptions: string[] = [
  TRIP_CHARACTER_LABELS[TripCharacterId.Mountains],
  TRIP_CHARACTER_LABELS[TripCharacterId.Sea],
  TRIP_CHARACTER_LABELS[TripCharacterId.City],
  TRIP_CHARACTER_LABELS[TripCharacterId.Lakes],
  TRIP_CHARACTER_LABELS[TripCharacterId.Countryside],
  TRIP_CHARACTER_LABELS[TripCharacterId.Other],
];
