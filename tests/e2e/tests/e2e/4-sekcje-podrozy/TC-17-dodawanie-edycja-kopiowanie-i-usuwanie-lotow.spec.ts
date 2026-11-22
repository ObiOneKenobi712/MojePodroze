import { RatingStars } from "@_src/enums/rating.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { FlightFormModel } from "@_src/models/flight-form.model";
import { foreignTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate, getTripDayDate } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-17 Użytkownik dodaje, edytuje, kopiuje i usuwa loty w podróży zagranicznej @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const trip = prepareTrip(foreignTripData);
  const day1 = getTripDayDate(trip.start_date, 1);
  const day2 = getTripDayDate(trip.start_date, 2);
  const day3 = getTripDayDate(trip.start_date, 3);
  const day5 = getTripDayDate(trip.start_date, 5);
  const flightCost = 850;
  const editedFlightCost = 900;
  const returnFlightCost = 900;
  const flight: FlightFormModel = {
    flightNumber: "TP 1245",
    departureAirport: "WAW",
    arrivalAirport: "LIS",
    departureAt: `${day1}T08:00`,
    arrivalAt: `${day1}T12:30`,
    cost: formatAmount(flightCost),
    rating: "4",
  };
  const editedFlight: FlightFormModel = {
    flightNumber: "LO 401",
    departureAirport: "KRK",
    arrivalAirport: "OPO",
    departureAt: `${day2}T09:15`,
    arrivalAt: `${day2}T13:45`,
    cost: formatAmount(editedFlightCost),
    rating: "3",
  };
  const returnFlight: FlightFormModel = {
    ...flight,
    flightNumber: "TP 1246",
    departureAirport: "LIS",
    arrivalAirport: "WAW",
    departureAt: `${day5}T18:00`,
    arrivalAt: "",
    cost: formatAmount(returnFlightCost),
  };
  const flightTitle = "WAW → LIS";
  const editedFlightTitle = "KRK → OPO";
  const returnFlightTitle = "LIS → WAW";

  const expectedEmptyText = "Nie dodano jeszcze żadnego lotu.";
  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedNumberError = "Podaj numer lotu, np. LO 327.";
  const expectedDepartureAirportError = "Podaj lotnisko wylotu.";
  const expectedArrivalAirportError = "Podaj lotnisko przylotu.";
  const expectedDepartureError = "Podaj datę i godzinę wylotu.";
  const expectedCostError = "Podaj kwotę, np. 45 albo 45,50.";
  const expectedRatingOptions = ["bez oceny", "5 / 5", "4 / 5", "3 / 5", "2 / 5", "1 / 5"];
  const expectedArrivalBeforeDepartureError = "Przylot nie może być wcześniejszy niż wylot.";
  const expectedArrivalTooLateError = "Przylot najpóźniej 48 godziny po wylocie.";
  const expectedEditFormTitle = "Edytuj lot";
  const expectedCostInEditForm = "850";
  const expectedNewFormTitle = "Nowy lot";
  const expectedDeleteDialogTitle = "Usunąć lot?";
  const expectedDeleteDialogMessage = "Lot LO 401 (KRK → OPO) zniknie z listy i z kosztorysu.";

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { flightsSection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Flights);

  await test.step("Zweryfikuj pustą zakładkę lotów", async () => {
    await expect(flightsSection.emptyText).toHaveText(expectedEmptyText);
    await expect(flightsSection.addButton).toBeVisible();
  });

  await flightsSection.clickAddButton();
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj błędy pustego formularza i listę ocen", async () => {
    await expect(flightsSection.formError).toHaveText(expectedFormError);
    await expect(flightsSection.flightNumberError).toHaveText(expectedNumberError);
    await expect(flightsSection.departureAirportError).toHaveText(expectedDepartureAirportError);
    await expect(flightsSection.arrivalAirportError).toHaveText(expectedArrivalAirportError);
    await expect(flightsSection.departureAtError).toHaveText(expectedDepartureError);
    await expect(flightsSection.costError).toHaveText(expectedCostError);
    await expect(flightsSection.ratingOptions).toHaveText(expectedRatingOptions);
  });

  await flightsSection.fillForm({ ...flight, arrivalAt: `${day1}T07:00` });
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj błąd przylotu przed wylotem", async () => {
    await expect(flightsSection.arrivalAtError).toHaveText(expectedArrivalBeforeDepartureError);
  });

  await flightsSection.fillForm({ ...flight, arrivalAt: `${day3}T09:00` });
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj błąd przylotu po ponad 48 godzinach", async () => {
    await expect(flightsSection.arrivalAtError).toHaveText(expectedArrivalTooLateError);
  });

  await flightsSection.fillForm(flight);
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj dodany lot", async () => {
    const flightItem = flightsSection.getItemByTitle(flightTitle);

    await expect(flightsSection.form).toBeHidden();
    await expect(flightItem).toContainText(flight.flightNumber);
    await expect(flightItem).toContainText(`wylot ${formatTripCardDate(day1)}, 08:00`);
    await expect(flightItem).toContainText(`przylot ${formatTripCardDate(day1)}, 12:30`);
    await expect(flightItem).toContainText(RatingStars.Four);
    await expect(flightItem).toContainText(formatMoney(flightCost));
    await expect(flightsSection.total).toHaveText(formatMoney(flightCost));
  });

  await flightsSection.clickEditItemButton(flightTitle);

  await test.step("Zweryfikuj formularz edycji lotu", async () => {
    await expect(flightsSection.formTitle).toHaveText(expectedEditFormTitle);
    await expect(flightsSection.flightNumberInput).toHaveValue(flight.flightNumber);
    await expect(flightsSection.departureAirportInput).toHaveValue(flight.departureAirport);
    await expect(flightsSection.arrivalAirportInput).toHaveValue(flight.arrivalAirport);
    await expect(flightsSection.departureAtInput).toHaveValue(flight.departureAt);
    await expect(flightsSection.arrivalAtInput).toHaveValue(flight.arrivalAt ?? "");
    await expect(flightsSection.costInput).toHaveValue(expectedCostInEditForm);
    await expect(flightsSection.ratingSelect).toHaveValue(flight.rating ?? "");
  });

  await flightsSection.fillForm(editedFlight);
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj zmieniony lot", async () => {
    const editedFlightItem = flightsSection.getItemByTitle(editedFlightTitle);

    await expect(flightsSection.getItemByTitle(flightTitle)).toBeHidden();
    await expect(editedFlightItem).toContainText(editedFlight.flightNumber);
    await expect(editedFlightItem).toContainText(`wylot ${formatTripCardDate(day2)}, 09:15`);
    await expect(editedFlightItem).toContainText(`przylot ${formatTripCardDate(day2)}, 13:45`);
    await expect(editedFlightItem).toContainText(RatingStars.Three);
    await expect(editedFlightItem).toContainText(formatMoney(editedFlightCost));
    await expect(flightsSection.total).toHaveText(formatMoney(editedFlightCost));
  });

  await flightsSection.clickCopyItemButton(editedFlightTitle);

  await test.step("Zweryfikuj formularz kopii lotu", async () => {
    await expect(flightsSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(flightsSection.flightNumberInput).toHaveValue(editedFlight.flightNumber);
  });

  await flightsSection.fillForm(returnFlight);
  await flightsSection.clickSaveButton();

  await test.step("Zweryfikuj dwa loty na liście", async () => {
    await expect(flightsSection.items).toHaveCount(2);
    await expect(flightsSection.getItemByTitle(returnFlightTitle)).not.toContainText("przylot");
    await expect(flightsSection.total).toHaveText(formatMoney(editedFlightCost + returnFlightCost));
  });

  const deleteDialog = await flightsSection.clickDeleteItemButton(editedFlightTitle);

  await test.step("Zweryfikuj okno usuwania lotu", async () => {
    await expect(deleteDialog.title).toHaveText(expectedDeleteDialogTitle);
    await expect(deleteDialog.message).toHaveText(expectedDeleteDialogMessage);
  });

  await deleteDialog.clickConfirmButton();

  await test.step("Zweryfikuj, że został tylko lot powrotny", async () => {
    await expect(flightsSection.items).toHaveCount(1);
    await expect(flightsSection.items).toContainText([returnFlight.flightNumber]);
    await expect(flightsSection.total).toHaveText(formatMoney(returnFlightCost));
  });
});
