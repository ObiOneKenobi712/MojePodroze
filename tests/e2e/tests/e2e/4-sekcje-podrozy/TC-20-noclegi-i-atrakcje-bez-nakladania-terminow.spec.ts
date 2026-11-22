import { RatingStars } from "@_src/enums/rating.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { PlaceFormModel } from "@_src/models/place-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate, formatTripDateRange, getTripDayDate } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-20 Użytkownik dodaje noclegi i atrakcje, a terminy noclegów nie mogą się nakładać @logged", async ({ myTripsPage, tripsApi }) => {
  const trip = prepareTrip(domesticTripData);
  const day1 = getTripDayDate(trip.start_date, 1);
  const day2 = getTripDayDate(trip.start_date, 2);
  const day3 = getTripDayDate(trip.start_date, 3);
  const day4 = getTripDayDate(trip.start_date, 4);
  const day5 = getTripDayDate(trip.start_date, 5);
  const hotelCost = 1200;
  const hostelCost = 150;
  const museumCost = 40;
  const hotel: PlaceFormModel = {
    name: "Hotel Gdańsk",
    kind: "accommodation",
    date: day1,
    checkOutDate: day4,
    cost: formatAmount(hotelCost),
    rating: "4",
  };
  const hostel: PlaceFormModel = {
    name: "Hostel Motława",
    kind: "accommodation",
    date: day4,
    cost: formatAmount(hostelCost),
    rating: "",
  };
  const museum: PlaceFormModel = {
    name: "Muzeum II Wojny Światowej",
    kind: "attraction",
    date: day2,
    cost: formatAmount(museumCost),
    rating: "5",
    note: "Kupić bilety online",
  };

  const expectedNewFormTitle = "Nowy nocleg lub atrakcja";
  const expectedCheckInLabel = "Zameldowanie";
  const expectedCheckOutLabel = "Wymeldowanie (opcjonalnie)";
  const expectedAttractionDateLabel = "Data";
  const expectedCheckOutError = "Wymeldowanie musi być później niż zameldowanie.";
  const expectedAccommodationLabel = "Nocleg";
  const expectedAttractionLabel = "Atrakcja";
  const expectedHotelNights = "3 noce";
  const expectedHostelNights = "1 noc";
  const expectedNoRating = "bez oceny";
  const expectedOverlapError = `W tym terminie jest już nocleg „${hotel.name}” (${formatTripDateRange(day1, day4)}). Zmień daty albo edytuj tamten nocleg.`;

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { placesSection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Places);
  await placesSection.clickAddButton();

  await test.step("Zweryfikuj formularz noclegu", async () => {
    await expect(placesSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(placesSection.kindSelect).toHaveValue("accommodation");
    await expect(placesSection.dateInput).toHaveAccessibleName(expectedCheckInLabel);
    await expect(placesSection.checkOutDateInput).toHaveAccessibleName(expectedCheckOutLabel);
  });

  await placesSection.fillForm({ ...hotel, checkOutDate: day1 });
  await placesSection.clickSaveButton();

  await test.step("Zweryfikuj błąd wymeldowania w dniu zameldowania", async () => {
    await expect(placesSection.checkOutDateError).toHaveText(expectedCheckOutError);
  });

  await placesSection.fillForm(hotel);
  await placesSection.clickSaveButton();

  await test.step("Zweryfikuj dodany nocleg", async () => {
    const hotelItem = placesSection.getItemByTitle(hotel.name);

    await expect(hotelItem).toContainText(expectedAccommodationLabel);
    await expect(hotelItem).toContainText(formatTripDateRange(day1, day4));
    await expect(hotelItem).toContainText(expectedHotelNights);
    await expect(hotelItem).toContainText(RatingStars.Four);
    await expect(hotelItem).toContainText(formatMoney(hotelCost));
  });

  await placesSection.addPlace({ ...hostel, date: day3 });

  await test.step("Zweryfikuj błąd nakładających się noclegów", async () => {
    await expect(placesSection.dateError).toHaveText(expectedOverlapError);
  });

  await placesSection.fillForm(hostel);
  await placesSection.clickSaveButton();

  await test.step("Zweryfikuj nocleg od dnia wymeldowania z hotelu", async () => {
    const hostelItem = placesSection.getItemByTitle(hostel.name);

    await expect(hostelItem).toContainText(formatTripDateRange(day4, day5));
    await expect(hostelItem).toContainText(expectedHostelNights);
    await expect(hostelItem).toContainText(expectedNoRating);
  });

  await placesSection.clickAddButton();
  await placesSection.selectKind("attraction");

  await test.step("Zweryfikuj formularz atrakcji", async () => {
    await expect(placesSection.dateInput).toHaveAccessibleName(expectedAttractionDateLabel);
    await expect(placesSection.checkOutDateInput).toBeHidden();
  });

  await placesSection.fillForm(museum);
  await placesSection.clickSaveButton();

  await test.step("Zweryfikuj dodaną atrakcję i sumę", async () => {
    const museumItem = placesSection.getItemByTitle(museum.name);

    await expect(museumItem).toContainText(expectedAttractionLabel);
    await expect(museumItem).toContainText(formatTripCardDate(day2));
    await expect(museumItem).toContainText(RatingStars.Five);
    await expect(museumItem).toContainText(museum.note ?? "");
    await expect(museumItem).toContainText(formatMoney(museumCost));
    await expect(placesSection.total).toHaveText(formatMoney(hotelCost + hostelCost + museumCost));
  });
});
