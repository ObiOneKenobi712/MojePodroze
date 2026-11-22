import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip, prepareUniqueCity } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { RecommendationsComponent } from "@_src/components/recommendations.component";
import { AddTripModel } from "@_src/models/trip.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate } from "@_src/utils/date.util";
import { formatAverageRating } from "@_src/utils/rating.util";

test("TC-34 Polecane miejsca z wcześniejszej podróży, ze średnią oceną co najmniej 4, przy kolejnej podróży do danego miasta @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const city = prepareUniqueCity("Kraków");
  const archivedTrip = prepareTrip({ ...domesticTripData, name: "Kosztorys test", destination_city: city });
  const completedTrip = prepareTrip({ ...domesticTripData, name: "Kraków jesień", destination_city: city });
  const newTrip = prepareTrip({ ...domesticTripData, name: "Kraków znowu", destination_city: city.toLowerCase() });
  const day = domesticTripData.start_date;
  const budkaArchivedRating = 5;
  const budkaCompletedRating = 3;
  const podAniolamiRating = 5;
  const wawelRating = 4;
  const hotelRating = 2;
  const expectedRestaurants = [
    `Pod Aniołami ${formatAverageRating([podAniolamiRating])}`,
    `Budka ${formatAverageRating([budkaArchivedRating, budkaCompletedRating])}`,
  ];
  const expectedPlaces = [`Wawel ${formatAverageRating([wawelRating])}`];

  const archivedTripId = await tripsApi.createTrip(archivedTrip, "planned");
  await tripsApi.createMeal(archivedTripId, { dish: "Obiad", restaurant_name: "Budka", meal_date: day, cost: 40, rating: budkaArchivedRating });
  await tripsApi.createPlace(archivedTripId, { name: "Wawel", kind: "attraction", visit_date: day, cost: 0, rating: wawelRating });
  await tripsApi.createMeal(archivedTripId, { dish: "Kolacja", restaurant_name: "Kazimierz", meal_date: day, cost: 60 });
  await tripsApi.moveTripToStatus(archivedTripId, "archived");

  const completedTripId = await tripsApi.createTrip(completedTrip, "planned");
  await tripsApi.createMeal(completedTripId, { dish: "Obiad", restaurant_name: "Budka", meal_date: day, cost: 40, rating: budkaCompletedRating });
  await tripsApi.createMeal(completedTripId, { dish: "Kolacja", restaurant_name: "Pod Aniołami", meal_date: day, cost: 90, rating: podAniolamiRating });
  await tripsApi.createPlace(completedTripId, {
    name: "Hotel Słaby",
    kind: "accommodation",
    visit_date: day,
    cost: 200,
    rating: hotelRating,
  });
  await tripsApi.moveTripToStatus(completedTripId, "completed");

  const newTripId = await tripsApi.createTrip(newTrip, "planned");

  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(newTrip.name);
  await tripPage.sectionTabs.clickTab(TripSectionTab.Costs);

  await verifyRecommendations(tripPage.recommendations, city.toLowerCase(), [archivedTrip, completedTrip], expectedRestaurants, expectedPlaces);

  const completedTripPage = await tripPage.recommendations.clickPreviousTripLink(completedTripId);

  await test.step("Zweryfikuj szczegóły wcześniejszej podróży", async () => {
    await expect(completedTripPage.tripTitle).toHaveText(completedTrip.name);
  });

  await completedTripPage.goto(`/${newTripId}`);

  await test.step("Zweryfikuj powrót do nowej podróży", async () => {
    await expect(completedTripPage.tripTitle).toHaveText(newTrip.name);
  });

  await completedTripPage.sectionTabs.clickTab(TripSectionTab.Costs);

  await verifyRecommendations(
    completedTripPage.recommendations,
    city.toLowerCase(),
    [archivedTrip, completedTrip],
    expectedRestaurants,
    expectedPlaces,
  );
});

async function verifyRecommendations(
  recommendations: RecommendationsComponent,
  expectedCity: string,
  expectedPreviousTrips: AddTripModel[],
  expectedRestaurants: string[],
  expectedPlaces: string[],
): Promise<void> {
  await test.step("Zweryfikuj wcześniejsze podróże do miasta", async () => {
    await expect(recommendations.previousTripsText).toContainText(`Wcześniejsze podróże do miasta ${expectedCity}:`);

    for (const trip of expectedPreviousTrips) {
      await expect(recommendations.previousTripsText).toContainText(trip.name);
      await expect(recommendations.previousTripsText).toContainText(
        `${formatTripCardDate(trip.start_date)} – ${formatTripCardDate(trip.end_date)}`,
      );
    }
  });

  await test.step("Zweryfikuj polecane restauracje", async () => {
    await expect(recommendations.restaurants).toHaveText(expectedRestaurants);
  });

  await test.step("Zweryfikuj polecane noclegi i atrakcje", async () => {
    await expect(recommendations.places).toHaveText(expectedPlaces);
  });
}
