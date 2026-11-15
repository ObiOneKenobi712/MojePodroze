import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { ExpenseFormModel } from "@_src/models/expense-form.model";
import { MealFormModel } from "@_src/models/meal-form.model";
import { PlaceFormModel } from "@_src/models/place-form.model";
import { TransportFormModel } from "@_src/models/transport-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { getTripDayDate, getTripDurationDays } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";
import { formatAverageRating } from "@_src/utils/rating.util";

test("TC-29 Kosztorys sumuje koszty według sekcji i liczy średnie ocen @logged", async ({ myTripsPage, tripsApi }) => {
  const trip = prepareTrip({
    ...domesticTripData,
    end_date: getTripDayDate(domesticTripData.start_date, 4),
    planned_budget: 1000,
  });
  const day1 = trip.start_date;
  const tripDays = getTripDurationDays(trip.start_date, trip.end_date);

  const pretzelCost = 499;
  const trainCost = 300;
  const ticketCost = 100;
  const wawelCost = 0;
  const zapiekankaCost = 25;
  const pretzelRating = 5;
  const trainRating = 4;
  const wawelRating = 4;

  const pretzel: MealFormModel = {
    dish: "Obwarzanek",
    restaurant: "Budka",
    date: day1,
    cost: formatAmount(pretzelCost),
    rating: String(pretzelRating),
  };
  const train: TransportFormModel = {
    transportMean: "Pociąg",
    date: day1,
    routeFrom: "Warszawa",
    routeTo: "Kraków",
    cost: formatAmount(trainCost),
    rating: String(trainRating),
  };
  const trainTitle = "Warszawa → Kraków";
  const ticket: ExpenseFormModel = { description: "Bilet", category: "Bilety wstępu", cost: formatAmount(ticketCost) };
  const wawel: PlaceFormModel = {
    name: "Wawel",
    kind: "attraction",
    date: day1,
    cost: formatAmount(wawelCost),
    rating: String(wawelRating),
  };
  const zapiekanka: MealFormModel = {
    dish: "Zapiekanka",
    restaurant: "Bar",
    date: day1,
    cost: formatAmount(zapiekankaCost),
    rating: "",
  };

  const totalAfterFirstItems = pretzelCost + trainCost + ticketCost;
  const totalAfterAllItems = totalAfterFirstItems + wawelCost + zapiekankaCost;
  const totalAfterDeletingTrain = totalAfterAllItems - trainCost;

  const expectedNoRatingsText = "brak ocen";
  const expectedNoRatingsInExpensesText = "bez ocen";
  const expectedEmptySectionCells = ["0", expectedNoRatingsText, formatMoney(0)];
  const expectedEmptyExpensesCells = ["0", expectedNoRatingsInExpensesText, formatMoney(0)];
  const expectedDailyAverage = `${formatMoney(totalAfterFirstItems / tripDays)} (${tripDays} dni)`;

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { sectionTabs, costSummary, mealsSection, transportSection, expensesSection, placesSection } = tripPage;

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj pusty kosztorys podróży krajowej", async () => {
    await expect(costSummary.total).toHaveText(formatMoney(0));
    await expect(costSummary.rating).toHaveText(expectedNoRatingsText);
    await expect(costSummary.getSectionRow("flights")).toBeHidden();
    await expect(costSummary.getSectionCells("transport")).toHaveText(expectedEmptySectionCells);
    await expect(costSummary.getSectionCells("meals")).toHaveText(expectedEmptySectionCells);
    await expect(costSummary.getSectionCells("places")).toHaveText(expectedEmptySectionCells);
    await expect(costSummary.getSectionCells("expenses")).toHaveText(expectedEmptyExpensesCells);
    await expect(costSummary.recommendations).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Meals);
  await mealsSection.addMeal(pretzel);

  await test.step(`Zweryfikuj pozycję „${pretzel.dish}” na liście`, async () => {
    await expect(mealsSection.getItemByTitle(pretzel.dish)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Transport);
  await transportSection.addTransport(train);

  await test.step(`Zweryfikuj pozycję „${trainTitle}” na liście`, async () => {
    await expect(transportSection.getItemByTitle(trainTitle)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.addExpense(ticket);

  await test.step(`Zweryfikuj pozycję „${ticket.description}” na liście`, async () => {
    await expect(expensesSection.getItemByTitle(ticket.description)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj sumę, średnią dzienną i ocenę zbiorczą", async () => {
    await expect(costSummary.total).toHaveText(formatMoney(totalAfterFirstItems));
    await expect(costSummary.daily).toHaveText(expectedDailyAverage);
    await expect(costSummary.rating).toHaveText(formatAverageRating([pretzelRating, trainRating]));
  });

  await test.step("Zweryfikuj tabelę sekcji", async () => {
    await expect(costSummary.getSectionCells("transport")).toHaveText([
      "1",
      formatAverageRating([trainRating]),
      formatMoney(trainCost),
    ]);
    await expect(costSummary.getSectionCells("meals")).toHaveText([
      "1",
      formatAverageRating([pretzelRating]),
      formatMoney(pretzelCost),
    ]);
    await expect(costSummary.getSectionCells("places")).toHaveText(expectedEmptySectionCells);
    await expect(costSummary.getSectionCells("expenses")).toHaveText([
      "1",
      expectedNoRatingsInExpensesText,
      formatMoney(ticketCost),
    ]);
    await expect(costSummary.footerCells).toHaveText(["3", "", formatMoney(totalAfterFirstItems)]);
  });

  await sectionTabs.clickTab(TripSectionTab.Places);
  await placesSection.addPlace(wawel);

  await test.step(`Zweryfikuj pozycję „${wawel.name}” na liście`, async () => {
    await expect(placesSection.getItemByTitle(wawel.name)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Meals);
  await mealsSection.addMeal(zapiekanka);

  await test.step(`Zweryfikuj pozycję „${zapiekanka.dish}” na liście`, async () => {
    await expect(mealsSection.getItemByTitle(zapiekanka.dish)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj, że pozycja bez oceny nie wpływa na średnią", async () => {
    await expect(costSummary.total).toHaveText(formatMoney(totalAfterAllItems));
    await expect(costSummary.rating).toHaveText(formatAverageRating([pretzelRating, trainRating, wawelRating]));
    await expect(costSummary.getSectionCells("meals")).toHaveText([
      "2",
      formatAverageRating([pretzelRating]),
      formatMoney(pretzelCost + zapiekankaCost),
    ]);
    await expect(costSummary.getSectionCells("places")).toHaveText([
      "1",
      formatAverageRating([wawelRating]),
      formatMoney(wawelCost),
    ]);
  });

  await sectionTabs.clickTab(TripSectionTab.Transport);
  const deleteDialog = await transportSection.clickDeleteItemButton(trainTitle);
  await deleteDialog.clickConfirmButton();

  await test.step(`Zweryfikuj usunięcie pozycji „${trainTitle}”`, async () => {
    await expect(transportSection.getItemByTitle(trainTitle)).toBeHidden();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj kosztorys po usunięciu przejazdu", async () => {
    await expect(costSummary.total).toHaveText(formatMoney(totalAfterDeletingTrain));
    await expect(costSummary.getSectionCells("transport")).toHaveText(expectedEmptySectionCells);
    await expect(costSummary.rating).toHaveText(formatAverageRating([pretzelRating, wawelRating]));
  });
});
