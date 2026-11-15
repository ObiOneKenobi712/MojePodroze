import { RATING_STAR } from "@_src/enums/rating.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { ExpenseFormModel } from "@_src/models/expense-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { addDaysToDate, formatTripCardDate } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-21 Po dodaniu wydatków i innych, suma wydatków jest widoczna w kosztorysie podróży @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const trip = prepareTrip(domesticTripData);
  const insuranceCost = 89.99;
  const magnetCost = 15;
  const insurance: ExpenseFormModel = {
    description: "Ubezpieczenie podróżne",
    category: "Ubezpieczenie",
    date: addDaysToDate(trip.start_date, -21),
    cost: formatAmount(insuranceCost),
  };
  const magnet: ExpenseFormModel = {
    description: "Magnes na lodówkę",
    category: "Pamiątki",
    cost: formatAmount(magnetCost),
  };
  const expensesTotal = insuranceCost + magnetCost;

  const expectedNewFormTitle = "Nowy wydatek";
  const expectedCategories = ["Bilety wstępu", "Pamiątki", "Ubezpieczenie", "Zakupy", "Opłaty i parkingi", "Inne"];
  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedDescriptionError = "Podaj, na co był wydatek.";
  const expectedCostError = "Podaj kwotę, np. 45 albo 45,50.";
  const expectedNoDateText = "bez daty";
  const expectedCostSummaryCells = ["2", "bez ocen", formatMoney(expensesTotal)];

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { expensesSection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.clickAddButton();

  await test.step("Zweryfikuj formularz wydatku bez oceny", async () => {
    await expect(expensesSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(expensesSection.categoryOptions).toHaveText(expectedCategories);
    await expect(expensesSection.dateInput).toHaveValue("");
    await expect(expensesSection.formSelects).toHaveCount(1);
  });

  await expensesSection.clickSaveButton();

  await test.step("Zweryfikuj błędy pustego formularza", async () => {
    await expect(expensesSection.formError).toHaveText(expectedFormError);
    await expect(expensesSection.descriptionError).toHaveText(expectedDescriptionError);
    await expect(expensesSection.costError).toHaveText(expectedCostError);
  });

  await expensesSection.fillForm(insurance);
  await expensesSection.clickSaveButton();

  await test.step("Zweryfikuj wydatek z datą sprzed podróży", async () => {
    const insuranceItem = expensesSection.getItemByTitle(insurance.description);

    await expect(insuranceItem).toContainText(insurance.category);
    await expect(insuranceItem).toContainText(formatTripCardDate(insurance.date ?? ""));
    await expect(insuranceItem).toContainText(formatMoney(insuranceCost));
    await expect(insuranceItem).not.toContainText(RATING_STAR);
  });

  await expensesSection.addExpense(magnet);

  await test.step("Zweryfikuj wydatek bez daty i sumę", async () => {
    const magnetItem = expensesSection.getItemByTitle(magnet.description);

    await expect(magnetItem).toContainText(magnet.category);
    await expect(magnetItem).toContainText(expectedNoDateText);
    await expect(magnetItem).toContainText(formatMoney(magnetCost));
    await expect(expensesSection.total).toHaveText(formatMoney(expensesTotal));
  });

  await tripPage.sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj wydatki w kosztorysie", async () => {
    await expect(tripPage.costSummary.getSectionCells("expenses")).toHaveText(expectedCostSummaryCells);
  });
});
