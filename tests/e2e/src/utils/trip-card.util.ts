import { TripStatusLabel } from "@_src/enums/trip.enum";
import { TripCardModel } from "@_src/models/trip-card.model";
import { getDaysUntil, getExpectedCountdownText, parseCardDate } from "@_src/utils/date.util";
import { compareAsc } from "date-fns";

function getCardsWithStatusSortedByDateFrom(cards: TripCardModel[], status: TripStatusLabel): TripCardModel[] {
  const cardsWithStatus = cards.filter((card) => card.status === status);

  return cardsWithStatus.sort((cardA, cardB) => compareAsc(parseCardDate(cardA.tripDateFrom), parseCardDate(cardB.tripDateFrom)));
}

export function getExpectedCardsOrder(cards: TripCardModel[]): TripCardModel[] {
  const plannedCards = getCardsWithStatusSortedByDateFrom(cards, TripStatusLabel.Planned);
  const inProgressCards = getCardsWithStatusSortedByDateFrom(cards, TripStatusLabel.InProgress);
  const completedCards = getCardsWithStatusSortedByDateFrom(cards, TripStatusLabel.Completed);
  const archivedCards = getCardsWithStatusSortedByDateFrom(cards, TripStatusLabel.Archived);

  return [...plannedCards, ...inProgressCards, ...completedCards, ...archivedCards];
}

export function getExpectedCountdownForNearestTrip(cards: TripCardModel[]): string {
  const nearestPlannedCard = cards.find(
    (card) => card.status === TripStatusLabel.Planned && getDaysUntil(card.tripDateFrom) >= 0,
  );
  const daysLeft = getDaysUntil(nearestPlannedCard!.tripDateFrom);

  return getExpectedCountdownText(daysLeft);
}
