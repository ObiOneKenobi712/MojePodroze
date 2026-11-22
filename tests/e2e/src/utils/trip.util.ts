import { TRIP_CHARACTER_LABELS, TRIP_TYPE_LABELS, TripStatusLabel } from "@_src/enums/trip.enum";
import { TripCardModel } from "@_src/models/trip-card.model";
import { TripDetailsModel } from "@_src/models/trip-details.model";
import { AddTripModel } from "@_src/models/trip.model";
import { formatTripCardDate, getTripDurationDays } from "@_src/utils/date.util";
import { formatMoney } from "@_src/utils/money.util";

export function parseTripCardData(text: string): Omit<TripCardModel, "tripName" | "status"> {
  const [dates, tripType, tripCharacter] = text.split(" · , ");
  const [tripDateFrom, tripDateTo] = dates.split(" – ");

  return { tripDateFrom, tripDateTo, tripType, tripCharacter };
}

export function getExpectedTripCard(trip: AddTripModel, status: TripStatusLabel): TripCardModel {
  return {
    tripName: trip.name,
    status,
    tripDateFrom: formatTripCardDate(trip.start_date),
    tripDateTo: formatTripCardDate(trip.end_date),
    tripType: TRIP_TYPE_LABELS[trip.trip_type],
    tripCharacter: TRIP_CHARACTER_LABELS[trip.character_id],
  };
}

export function getExpectedTripDetails(trip: AddTripModel, status: TripStatusLabel): TripDetailsModel {
  const card = getExpectedTripCard(trip, status);
  const durationDays = getTripDurationDays(trip.start_date, trip.end_date);

  return {
    ...card,
    destination: `${trip.destination_city}, ${trip.destination_country}`,
    period: `${card.tripDateFrom} – ${card.tripDateTo}`,
    duration: durationDays === 1 ? "1 dzień" : `${durationDays} dni`,
    budget: formatBudget(trip.planned_budget),
  };
}

function formatBudget(budget?: number | null): string {
  if (budget === undefined || budget === null) {
    return "nie ustalono";
  }

  return formatMoney(budget);
}
