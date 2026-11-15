import { RatingStars } from "@_src/enums/rating.enum";
import {
  TRIP_CHARACTER_LABELS,
  TRIP_TYPE_LABELS,
  TripCharacterId,
  TripSectionTab,
  TripStatusLabel,
  TripType,
} from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { FlightFormModel } from "@_src/models/flight-form.model";
import { MealFormModel } from "@_src/models/meal-form.model";
import { TransportFormModel } from "@_src/models/transport-form.model";
import { testPngPhoto } from "@_src/test-data/photo.data";
import {
  getExpectedAlbumDayHeading,
  getIsoDateFromToday,
  getTripDayDate,
  getTripDurationDays,
} from "@_src/utils/date.util";
import { getExpectedSpentText, getExpectedWithinBudgetStatus } from "@_src/utils/budget.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";
import { formatAverageRating } from "@_src/utils/rating.util";

test("TC-32 Pełne życie podróży – od utworzenia do kosztorysu w archiwum @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const trip = prepareTrip({
    name: "Lizbona 2027",
    destination_city: "Lizbona",
    destination_country: "Portugalia",
    start_date: getIsoDateFromToday(60),
    end_date: getIsoDateFromToday(64),
    trip_type: TripType.Foreign,
    character_id: TripCharacterId.City,
    planned_budget: 4000,
  });
  const day1 = trip.start_date;
  const day2 = getTripDayDate(trip.start_date, 2);
  const tripDays = getTripDurationDays(trip.start_date, trip.end_date);
  const flightCost = 850;
  const taxiCost = 60;
  const mealCost = 95;
  const flightRating = 4;
  const taxiRating = 3;
  const mealRating = 5;
  const flight: FlightFormModel = {
    flightNumber: "TP 1245",
    departureAirport: "WAW",
    arrivalAirport: "LIS",
    departureAt: `${day1}T08:00`,
    cost: formatAmount(flightCost),
    rating: String(flightRating),
  };
  const taxi: TransportFormModel = {
    transportMean: "Taksówka",
    date: day1,
    routeFrom: "Lotnisko",
    routeTo: "Hotel",
    cost: formatAmount(taxiCost),
    rating: String(taxiRating),
  };
  const meal: MealFormModel = {
    dish: "Bacalhau",
    restaurant: "Taberna Alfama",
    date: day2,
    cost: formatAmount(mealCost),
    rating: String(mealRating),
  };
  const plannedBudget = trip.planned_budget ?? 0;
  const totalCost = flightCost + taxiCost + mealCost;

  const expectedPhotoUploadedText = "Dodano 1 zdjęcie.";
  const expectedDailyAverage = `${formatMoney(totalCost / tripDays)} (${tripDays} dni)`;
  const expectedBudgetText = getExpectedSpentText(totalCost, plannedBudget);
  const expectedBudgetStatus = getExpectedWithinBudgetStatus(totalCost, plannedBudget);
  const expectedReadOnlyNotice = "Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.";

  tripsApi.addTripToCleanup(trip.name);

  const tripFormPage = await myTripsPage.clickNewTripButton();
  myTripsPage = await tripFormPage.createTrip(trip);

  await test.step("Zweryfikuj kartę nowej podróży", async () => {
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    const plannedCard = await myTripsPage.getTripCard(trip.name);
    await expect(plannedCard.status).toBe(TripStatusLabel.Planned);
    await expect(plannedCard.tripType).toBe(TRIP_TYPE_LABELS[TripType.Foreign]);
    await expect(plannedCard.tripCharacter).toBe(TRIP_CHARACTER_LABELS[TripCharacterId.City]);
  });

  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { sectionTabs, flightsSection, transportSection, mealsSection, costSummary } = tripPage;

  await sectionTabs.clickTab(TripSectionTab.Flights);
  await flightsSection.addFlight(flight);

  await test.step("Zweryfikuj dodany lot", async () => {
    await expect(flightsSection.getItemByTitle("WAW → LIS")).toBeVisible();
    await expect(flightsSection.total).toHaveText(formatMoney(flightCost));
  });

  await sectionTabs.clickTab(TripSectionTab.Transport);
  await transportSection.addTransport(taxi);

  await test.step("Zweryfikuj dodany przejazd", async () => {
    await expect(transportSection.getItemByTitle("Lotnisko → Hotel")).toContainText(taxi.transportMean);
    await expect(transportSection.total).toHaveText(formatMoney(taxiCost));
  });

  await sectionTabs.clickTab(TripSectionTab.Meals);
  await mealsSection.addMeal(meal);

  await test.step("Zweryfikuj dodany posiłek", async () => {
    await expect(mealsSection.getItemByTitle(meal.dish)).toContainText(meal.restaurant);
    await expect(mealsSection.getItemByTitle(meal.dish)).toContainText(RatingStars.Five);
    await expect(mealsSection.total).toHaveText(formatMoney(mealCost));
  });

  const editTripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj wczytanie formularza edycji", async () => {
    await expect(editTripFormPage.nameInput).toHaveValue(trip.name);
  });

  await editTripFormPage.uploadPhoto(testPngPhoto, day1);

  await test.step("Zweryfikuj wgranie zdjęcia", async () => {
    await expect(editTripFormPage.photoUploadedText).toHaveText(expectedPhotoUploadedText);
  });

  const tripPageWithPhoto = await editTripFormPage.clickBackLink();

  await test.step("Zweryfikuj zdjęcie w albumie", async () => {
    await expect(tripPageWithPhoto.album.getDayHeading(day1)).toHaveText(getExpectedAlbumDayHeading(1, day1));
    await expect(tripPageWithPhoto.album.getDayPhotos(day1)).toHaveCount(1);
  });

  await tripPageWithPhoto.clickStartTripButton();

  await test.step("Zweryfikuj status W trakcie", async () => {
    await expect(tripPageWithPhoto.tripStatus).toHaveText(TripStatusLabel.InProgress);
  });

  await tripPageWithPhoto.clickCompleteTripButton();

  await test.step("Zweryfikuj status Zrealizowana", async () => {
    await expect(tripPageWithPhoto.tripStatus).toHaveText(TripStatusLabel.Completed);
  });

  await tripPageWithPhoto.clickArchiveButton();

  await test.step("Zweryfikuj podróż w archiwum", async () => {
    await expect(tripPageWithPhoto.tripStatus).toHaveText(TripStatusLabel.Archived);
    await expect(tripPageWithPhoto.readOnlyNotice).toHaveText(expectedReadOnlyNotice);
    await expect(tripPageWithPhoto.editButton).toBeHidden();
    await expect(tripPageWithPhoto.deleteButton).toBeHidden();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj kosztorys podróży", async () => {
    await expect(costSummary.total).toHaveText(formatMoney(totalCost));
    await expect(costSummary.daily).toHaveText(expectedDailyAverage);
    await expect(costSummary.rating).toHaveText(formatAverageRating([flightRating, taxiRating, mealRating]));
    await expect(costSummary.budget).toContainText(expectedBudgetText);
    await expect(costSummary.budgetStatus).toHaveText(expectedBudgetStatus);
    await expect(costSummary.getSectionCells("flights")).toHaveText(["1", formatAverageRating([flightRating]), formatMoney(flightCost)]);
    await expect(costSummary.getSectionCells("transport")).toHaveText(["1", formatAverageRating([taxiRating]), formatMoney(taxiCost)]);
    await expect(costSummary.getSectionCells("meals")).toHaveText(["1", formatAverageRating([mealRating]), formatMoney(mealCost)]);
  });

  const readOnlySections = [
    { tab: TripSectionTab.Flights, section: flightsSection },
    { tab: TripSectionTab.Transport, section: transportSection },
    { tab: TripSectionTab.Meals, section: mealsSection },
  ];

  for (const { tab, section } of readOnlySections) {
    await sectionTabs.clickTab(tab);

    await test.step(`Zweryfikuj zakładkę „${tab}” tylko do odczytu`, async () => {
      await expect(section.items).toHaveCount(1);
      await expect(section.addButton).toBeHidden();
      await expect(section.itemButtons).toHaveCount(0);
    });
  }

  myTripsPage = await tripPageWithPhoto.clickBackLink();

  await test.step("Zweryfikuj powrót na listę podróży", async () => {
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();
  });

  await myTripsPage.statusTabs.clickArchivedTab();
  const archivedCard = await myTripsPage.getTripCard(trip.name);

  await test.step("Zweryfikuj kartę podróży w archiwum", async () => {
    await expect(archivedCard.status).toBe(TripStatusLabel.Archived);
    await expect(myTripsPage.getCardCoverPhoto(trip.name)).toBeVisible();
  });
});
