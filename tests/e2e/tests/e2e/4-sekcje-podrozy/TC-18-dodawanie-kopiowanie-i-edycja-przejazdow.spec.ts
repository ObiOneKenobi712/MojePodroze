import { RatingStars } from "@_src/enums/rating.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { TransportFormModel } from "@_src/models/transport-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate, getTripDayDate } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-18 Użytkownik dodaje, kopiuje i edytuje przejazdy z wybranym środkiem transportu @logged", async ({ myTripsPage, tripsApi }) => {
  const trip = prepareTrip(domesticTripData);
  const day1 = getTripDayDate(trip.start_date, 1);
  const day4 = getTripDayDate(trip.start_date, 4);
  const day5 = getTripDayDate(trip.start_date, 5);
  const transportCost = 159.9;
  const editedTransportCost = 49;
  const transport: TransportFormModel = {
    transportMean: "Pociąg",
    date: day1,
    routeFrom: "Warszawa",
    routeTo: "Gdańsk",
    cost: formatAmount(transportCost),
    rating: "5",
  };
  const returnTransport: TransportFormModel = {
    ...transport,
    date: day5,
    routeFrom: "Gdańsk",
    routeTo: "Warszawa",
  };
  const editedTransport: TransportFormModel = {
    transportMean: "Autobus",
    date: day4,
    routeFrom: "Sopot",
    routeTo: "Kraków",
    cost: formatAmount(editedTransportCost),
    rating: "3",
  };
  const transportTitle = "Warszawa → Gdańsk";
  const returnTransportTitle = "Gdańsk → Warszawa";
  const editedTransportTitle = "Sopot → Kraków";

  const expectedEmptyText = "Nie dodano jeszcze żadnego przejazdu.";
  const expectedNewFormTitle = "Nowy przejazd";
  const expectedTransportMeans = ["Samochód", "Pociąg", "Autobus", "Prom", "Taksówka", "Komunikacja miejska", "Rower", "Inny"];
  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedRouteFromError = "Podaj miejsce wyjazdu.";
  const expectedRouteToError = "Podaj miejsce docelowe.";
  const expectedCostError = "Podaj kwotę, np. 45 albo 45,50.";
  const expectedEditFormTitle = "Edytuj przejazd";
  const expectedCostInEditForm = "159,9";

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { transportSection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Transport);

  await test.step("Zweryfikuj pustą zakładkę transportu", async () => {
    await expect(transportSection.emptyText).toHaveText(expectedEmptyText);
    await expect(transportSection.addButton).toBeVisible();
  });

  await transportSection.clickAddButton();

  await test.step("Zweryfikuj formularz nowego przejazdu", async () => {
    await expect(transportSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(transportSection.transportMeanOptions).toHaveText(expectedTransportMeans);
    await expect(transportSection.dateInput).toHaveValue(day1);
  });

  await transportSection.clickSaveButton();

  await test.step("Zweryfikuj błędy pustego formularza", async () => {
    await expect(transportSection.formError).toHaveText(expectedFormError);
    await expect(transportSection.routeFromError).toHaveText(expectedRouteFromError);
    await expect(transportSection.routeToError).toHaveText(expectedRouteToError);
    await expect(transportSection.costError).toHaveText(expectedCostError);
  });

  await transportSection.fillForm(transport);
  await transportSection.clickSaveButton();

  await test.step("Zweryfikuj dodany przejazd", async () => {
    const transportItem = transportSection.getItemByTitle(transportTitle);

    await expect(transportItem).toContainText(transport.transportMean);
    await expect(transportItem).toContainText(formatTripCardDate(day1));
    await expect(transportItem).toContainText(RatingStars.Five);
    await expect(transportItem).toContainText(formatMoney(transportCost));
    await expect(transportSection.total).toHaveText(formatMoney(transportCost));
  });

  await transportSection.clickCopyItemButton(transportTitle);
  await transportSection.fillForm(returnTransport);
  await transportSection.clickSaveButton();

  await test.step("Zweryfikuj skopiowany przejazd", async () => {
    await expect(transportSection.items).toHaveCount(2);
    await expect(transportSection.total).toHaveText(formatMoney(transportCost + transportCost));
  });

  await transportSection.clickEditItemButton(returnTransportTitle);

  await test.step("Zweryfikuj formularz edycji przejazdu", async () => {
    await expect(transportSection.formTitle).toHaveText(expectedEditFormTitle);
    await expect(transportSection.selectedTransportMean).toHaveText(returnTransport.transportMean);
    await expect(transportSection.dateInput).toHaveValue(returnTransport.date);
    await expect(transportSection.routeFromInput).toHaveValue(returnTransport.routeFrom);
    await expect(transportSection.routeToInput).toHaveValue(returnTransport.routeTo);
    await expect(transportSection.costInput).toHaveValue(expectedCostInEditForm);
    await expect(transportSection.ratingSelect).toHaveValue(returnTransport.rating ?? "");
  });

  await transportSection.fillForm(editedTransport);
  await transportSection.clickSaveButton();

  await test.step("Zweryfikuj zmieniony przejazd", async () => {
    const editedTransportItem = transportSection.getItemByTitle(editedTransportTitle);

    await expect(transportSection.getItemByTitle(returnTransportTitle)).toBeHidden();
    await expect(editedTransportItem).toContainText(editedTransport.transportMean);
    await expect(editedTransportItem).toContainText(formatTripCardDate(day4));
    await expect(editedTransportItem).toContainText(RatingStars.Three);
    await expect(editedTransportItem).toContainText(formatMoney(editedTransportCost));
    await expect(transportSection.total).toHaveText(formatMoney(transportCost + editedTransportCost));
  });
});
