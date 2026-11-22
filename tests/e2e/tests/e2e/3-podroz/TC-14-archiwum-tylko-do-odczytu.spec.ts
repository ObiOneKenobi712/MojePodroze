import { TripSectionTab, TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareMeal } from "@_src/factories/meal.factory";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { defaultPackingItems } from "@_src/test-data/trip-section.data";
import { foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedPackingProgress } from "@_src/utils/checklist.util";

test("TC-14 Zarchiwizowana podróż nie może być edytowana, dopóki jej status nie zostanie cofnięty @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const trip = prepareTrip(foreignTripData);
  const expectedReadOnlyNotice = "Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.";
  const expectedReadOnlyFormText =
    "Podróż jest w archiwum – nie można jej edytować. Aby coś zmienić, cofnij jej status.";
  const expectedPackingProgress = getExpectedPackingProgress(0, defaultPackingItems.length);

  const tripId = await tripsApi.createTrip(trip, "completed");
  const mealId = await tripsApi.createMeal(tripId, prepareMeal(trip));

  await myTripsPage.goto();
  let tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickArchiveButton();

  await test.step("Zweryfikuj zarchiwizowaną podróż", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Archived);
    await expect(tripPage.readOnlyNotice).toHaveText(expectedReadOnlyNotice);
    await expect(tripPage.editButton).toBeHidden();
    await expect(tripPage.deleteButton).toBeHidden();
  });

  await tripPage.sectionTabs.clickTab(TripSectionTab.Meals);

  await test.step("Zweryfikuj zawartość zakaładki posiłki, gdy widok podróży jest tylko do odczytu", async () => {
    await expect(tripPage.mealsSection.getItem(mealId)).toBeVisible();
    await expect(tripPage.mealsSection.addButton).toBeHidden();
    await expect(tripPage.mealsSection.getEditButton(mealId)).toBeHidden();
    await expect(tripPage.mealsSection.getCopyButton(mealId)).toBeHidden();
    await expect(tripPage.mealsSection.getDeleteButton(mealId)).toBeHidden();
  });

  const sectionsWithAddButton = [
    { tab: TripSectionTab.Plan, addButton: tripPage.planSection.addButton },
    { tab: TripSectionTab.Flights, addButton: tripPage.flightsSection.addButton },
    { tab: TripSectionTab.Transport, addButton: tripPage.transportSection.addButton },
    { tab: TripSectionTab.Places, addButton: tripPage.placesSection.addButton },
    { tab: TripSectionTab.Expenses, addButton: tripPage.expensesSection.addButton },
    { tab: TripSectionTab.Wishlist, addButton: tripPage.wishlistSection.addButton },
    { tab: TripSectionTab.Packing, addButton: tripPage.packingSection.addButton },
    { tab: TripSectionTab.Diary, addButton: tripPage.diarySection.addButton },
  ];

  for (const { tab, addButton } of sectionsWithAddButton) {
    await tripPage.sectionTabs.clickTab(tab);

    await test.step(`Zweryfikuj brak możliwości dodawania pozycji w zakładce „${tab}”`, async () => {
      await expect(addButton).toBeHidden();
    });
  }

  await tripPage.sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj zablokowane pola wyboru z listy pakowania", async () => {
    await expect(tripPage.packingSection.checkboxes).toHaveCount(defaultPackingItems.length);

    for (const checkbox of await tripPage.packingSection.checkboxes.all()) {
      await expect(checkbox).toBeDisabled();
    }
  });

  const tripFormPage = await tripPage.gotoEditForm(tripId);

  await test.step("Zweryfikuj blokadę edycji formularza podróży", async () => {
    await expect(tripFormPage.readOnlyText).toContainText(expectedReadOnlyFormText);
    await expect(tripFormPage.backToTripLink).toBeVisible();
  });

  tripPage = await tripFormPage.clickBackToTripLink();
  await tripPage.clickRevertStatusButton();

  await test.step("Zweryfikuj podróż po cofnięciu statusu z archiwum", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
    await expect(tripPage.readOnlyNotice).toBeHidden();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  for (const { tab, addButton } of sectionsWithAddButton) {
    await tripPage.sectionTabs.clickTab(tab);

    await test.step(`Zweryfikuj możliwość dodawania pozycji w zakładce „${tab}”`, async () => {
      await expect(addButton).toBeVisible();
    });
  }

  await tripPage.sectionTabs.clickTab(TripSectionTab.Meals);

  await test.step("Zweryfikuj możliwość edycji pozycji z zakaładki posiłki, po cofnięciu statusu podróży", async () => {
    await expect(tripPage.mealsSection.addButton).toBeVisible();
    await expect(tripPage.mealsSection.getEditButton(mealId)).toBeVisible();
    await expect(tripPage.mealsSection.getCopyButton(mealId)).toBeVisible();
    await expect(tripPage.mealsSection.getDeleteButton(mealId)).toBeVisible();
  });

  await tripPage.sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj listę pakowania po cofnięciu z archiwum", async () => {
    await expect(tripPage.packingSection.progress).toHaveText(expectedPackingProgress);

     for (const checkbox of await tripPage.packingSection.checkboxes.all()) {
      await expect(checkbox).toBeEnabled();
    }
  });
});
