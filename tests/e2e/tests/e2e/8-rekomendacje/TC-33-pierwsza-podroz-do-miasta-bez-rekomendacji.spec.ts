import { TripSectionTab, TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip, prepareUniqueCity } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { AddMealModel } from "@_src/models/meal.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatAverageRating } from "@_src/utils/rating.util";

test("TC-33 Pierwsza podróż do miasta nie ma rekomendacji, a podróż „w planie” nie wlicza się do wcześniejszych podróży @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const city = prepareUniqueCity("Zamość");
  const firstTrip = prepareTrip({ ...domesticTripData, name: "Zamość plan", destination_city: city });
  const secondTrip = prepareTrip({ ...domesticTripData, name: "Zamość znowu", destination_city: city });
  const meal: AddMealModel = {
    dish: "Pierogi",
    restaurant_name: "Restauracja z planu",
    meal_date: firstTrip.start_date,
    cost: 50,
    rating: 5,
  };

  const expectedFirstTripText = `To pierwsza podróż do miasta ${city}. Gdy wrócisz tu kolejny raz, pokażemy najlepiej ocenione restauracje i miejsca z tej podróży.`;
  const expectedPreviousTripsText = `Wcześniejsze podróże do miasta ${city}: ${firstTrip.name}`;
  const expectedRestaurants = [`${meal.restaurant_name} ${formatAverageRating([meal.rating ?? 0])}`];

  const firstTripId = await tripsApi.createTrip(firstTrip, "planned");
  await tripsApi.createMeal(firstTripId, meal);

  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(firstTrip.name);
  const { sectionTabs, recommendations } = tripPage;

  await test.step("Zweryfikuj podróż „w planie” z posiłkiem", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj brak rekomendacji dla pierwszej podróży", async () => {
    await expect(recommendations.emptyText).toHaveText(expectedFirstTripText);
  });

  const secondTripId = await tripsApi.createTrip(secondTrip, "planned");
  await tripPage.goto(`/${secondTripId}`);

  await test.step("Zweryfikuj otwarcie drugiej podróży", async () => {
    await expect(tripPage.tripTitle).toHaveText(secondTrip.name);
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj, że podróż „w planie” nie liczy się jako wcześniejsza", async () => {
    await expect(recommendations.emptyText).toHaveText(expectedFirstTripText);
  });

  await tripPage.goto(`/${firstTripId}`);
  await tripPage.clickStartTripButton();

  await test.step("Zweryfikuj rozpoczęcie pierwszej podróży", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.InProgress);
  });

  await tripPage.goto(`/${secondTripId}`);

  await test.step("Zweryfikuj ponowne otwarcie drugiej podróży", async () => {
    await expect(tripPage.tripTitle).toHaveText(secondTrip.name);
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj rekomendacje z podróży „w trakcie”", async () => {
    await expect(recommendations.previousTripsText).toContainText(expectedPreviousTripsText);
    await expect(recommendations.restaurants).toHaveText(expectedRestaurants);
  });
});
