import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareMeal } from "@_src/factories/meal.factory";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData } from "@_src/test-data/trip.data";
import { getExpectedSpentText, getExpectedWithinBudgetStatus } from "@_src/utils/budget.util";
import { formatMoney } from "@_src/utils/money.util";

test("TC-24 Użytkownik ustawia, zmienia i usuwa planowany budżet podróży @logged", async ({
  myTripsPage,
  tripsApi,
  page,
}) => {
  const initialBudget = 5000;
  const updatedBudget = 4000.5;
  const emptyBudget = "";
  const zeroBudget = "0";
  const trip = prepareTrip({ ...domesticTripData, planned_budget: initialBudget });
  const meal = prepareMeal(trip);

  const expectedNoBudget = "nie ustalono";
  const expectedNoBudgetStatus = "Nie ustalono budżetu. Ustaw go w edycji podróży.";
  const expectedEditFormHeading = "Edytuj podróż";
  const expectedBudgetError = "Podaj kwotę większą od zera, np. 2500 albo 2500,50.";

  const tripId = await tripsApi.createTrip(trip, "planned");
  await tripsApi.createMeal(tripId, meal);
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);

  await test.step("Zweryfikuj budżet w przeglądzie", async () => {
    await expect(tripPage.overviewBudget).toHaveText(formatMoney(initialBudget));
  });

  const tripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj wczytanie formularza edycji", async () => {
    await expect(tripFormPage.nameInput).toHaveValue(trip.name);
  });

  await tripFormPage.fillBudget(emptyBudget);
  await tripFormPage.clickSaveButton();

  await test.step("Zweryfikuj podróż bez budżetu", async () => {
    await expect(tripPage.overviewBudget).toHaveText(expectedNoBudget);
  });

  await tripPage.sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj kosztorys bez budżetu", async () => {
    await expect(tripPage.costSummary.budgetStatus).toHaveText(expectedNoBudgetStatus);
  });

  const budgetFormPage = await tripPage.costSummary.clickSetBudgetLink();

  await test.step("Zweryfikuj otwarcie formularza edycji", async () => {
    await expect(page).toHaveURL(`/podroze/${tripId}/edycja`);
    await expect(budgetFormPage.heading).toHaveText(expectedEditFormHeading);
    await expect(budgetFormPage.nameInput).toHaveValue(trip.name);
  });

  await budgetFormPage.fillBudget(zeroBudget);
  await budgetFormPage.clickSaveButton();

  await test.step("Zweryfikuj błąd budżetu równego zero", async () => {
    await expect(budgetFormPage.budgetError).toHaveText(expectedBudgetError);
  });

  await budgetFormPage.fillBudget(String(updatedBudget));
  await budgetFormPage.clickSaveButton();

  await test.step("Zweryfikuj nowy budżet w przeglądzie", async () => {
    await expect(tripPage.overviewBudget).toHaveText(formatMoney(updatedBudget));
  });

  await tripPage.sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj budżet w kosztorysie", async () => {
    await expect(tripPage.costSummary.budget).toContainText(getExpectedSpentText(meal.cost, updatedBudget));
    await expect(tripPage.costSummary.budgetStatus).toHaveText(getExpectedWithinBudgetStatus(meal.cost, updatedBudget));
  });
});
