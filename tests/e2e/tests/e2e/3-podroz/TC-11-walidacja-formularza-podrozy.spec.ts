import { TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { AddTripModel } from "@_src/models/trip.model";
import { foreignTripData } from "@_src/test-data/trip.data";
import { getIsoDateFromToday } from "@_src/utils/date.util";

test("TC-11 Formularz podróży wskazuje błędne pola i zapisuje podróż po ich poprawieniu @logged", async ({
  myTripsPage,
  tripsApi,
  page,
}) => {
  const trip = prepareTrip(foreignTripData);
  const tripWithInvalidData: AddTripModel = { ...trip, end_date: getIsoDateFromToday(25), planned_budget: 0 };
  const validTrip: AddTripModel = { ...trip, end_date: trip.start_date, planned_budget: 2500 };
  const abandonedTripName = prepareTrip(foreignTripData).name;

  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedNameError = "Podaj nazwę podróży.";
  const expectedCityError = "Podaj miasto.";
  const expectedCountryError = "Podaj kraj.";
  const expectedStartDateError = "Podaj datę rozpoczęcia.";
  const expectedEndDateError = "Podaj datę zakończenia.";
  const expectedDateOrderError = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.";
  const expectedBudgetError = "Podaj kwotę większą od zera, np. 2500 albo 2500,50.";
  const expectedLeaveDialogTitle = "Wyjść bez zapisania?";
  const expectedStayButtonText = "Zostań";
  const expectedLeaveButtonText = "Wyjdź bez zapisania";

  tripsApi.addTripToCleanup(validTrip.name);

  const tripFormPage = await myTripsPage.clickNewTripButton();
  await tripFormPage.clickSaveButton();

  await test.step("Zweryfikuj błędy pustego formularza", async () => {
    await expect(page).toHaveURL(tripFormPage.url);
    await expect(tripFormPage.formError).toHaveText(expectedFormError);
    await expect(tripFormPage.nameError).toHaveText(expectedNameError);
    await expect(tripFormPage.cityError).toHaveText(expectedCityError);
    await expect(tripFormPage.countryError).toHaveText(expectedCountryError);
    await expect(tripFormPage.startDateError).toHaveText(expectedStartDateError);
    await expect(tripFormPage.endDateError).toHaveText(expectedEndDateError);
  });

  await tripFormPage.fillForm(tripWithInvalidData);
  await tripFormPage.clickSaveButton();

  await test.step("Zweryfikuj błędy dat i budżetu", async () => {
    await expect(tripFormPage.nameError).toBeHidden();
    await expect(tripFormPage.cityError).toBeHidden();
    await expect(tripFormPage.countryError).toBeHidden();
    await expect(tripFormPage.startDateError).toBeHidden();
    await expect(tripFormPage.endDateError).toHaveText(expectedDateOrderError);
    await expect(tripFormPage.budgetError).toHaveText(expectedBudgetError);
  });

  await tripFormPage.fillBudget("abc");
  await tripFormPage.clickSaveButton();

  await test.step("Zweryfikuj błąd budżetu z tekstem", async () => {
    await expect(tripFormPage.budgetError).toHaveText(expectedBudgetError);
  });

  myTripsPage = await tripFormPage.createTrip(validTrip);

  await test.step("Zweryfikuj zapisaną podróż", async () => {
    await expect(page).toHaveURL(myTripsPage.url);
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    const card = await myTripsPage.getTripCard(validTrip.name);
    await expect(card.status).toBe(TripStatusLabel.Planned);
  });

  const abandonedTripFormPage = await myTripsPage.clickNewTripButton();
  await abandonedTripFormPage.fillName(abandonedTripName);
  const leaveDialog = await abandonedTripFormPage.clickCancelButton();

  await test.step("Zweryfikuj okno wyjścia bez zapisania", async () => {
    await expect(leaveDialog.title).toHaveText(expectedLeaveDialogTitle);
    await expect(leaveDialog.cancelButton).toHaveText(expectedStayButtonText);
    await expect(leaveDialog.confirmButton).toHaveText(expectedLeaveButtonText);
  });

  await leaveDialog.clickConfirmButton();

  await test.step("Zweryfikuj, że podróż nie została zapisana", async () => {
    await expect(page).toHaveURL(myTripsPage.url);
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    const tripNames = (await myTripsPage.getAllTripCards()).map((card) => card.tripName);
    await expect(tripNames).not.toContain(abandonedTripName);
  });
});
