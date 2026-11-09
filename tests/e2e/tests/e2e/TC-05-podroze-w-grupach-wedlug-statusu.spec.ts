import { StatusTabsComponent } from "@_src/components/status-tabs.component";
import { StatusTabLabel, TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { TripCardModel } from "@_src/models/trip-card.model";
import { completedTripData, inProgressTripData, plannedTripData } from "@_src/test-data/trip.data";
import { getExpectedCardsOrder, getExpectedCountdownForNearestTrip } from "@_src/utils/trip-card.util";

test("TC-05 Podróże wyświetlają się w grupach według statusu @logged", async ({ myTripsPage, tripsApi, page }) => {
  const plannedTrip = prepareTrip(plannedTripData);
  const inProgressTrip = prepareTrip(inProgressTripData);
  const completedTrip = prepareTrip(completedTripData);
  const expectedPageTitle = "Moje podróże";

  const { 
    statusTabs, 
    nextTripCountdown, 
    newTripButton, 
    loadingText, 
    tripCardStatuses, 
    tripCardNames,
    tripCardDetails } = myTripsPage;

  const plannedTripId = await tripsApi.createTrip(plannedTrip, "planned");
  await tripsApi.createTrip(inProgressTrip, "in_progress");
  await tripsApi.createTrip(completedTrip, "completed");

  await test.step("Przejdź na stronę Moje podróże", async() => {
    await myTripsPage.goto();
    await expect(page).toHaveTitle(expectedPageTitle);
    await expect(newTripButton).toBeVisible();
    await expect(loadingText).toBeHidden();
  });

  const initialTabs = await test.step("Zweryfikuj zakładki i liczniki", async () => {
    await verifyStatusTabsVisible(statusTabs);

    const tabs = await statusTabs.getTabs();
    const expectedActiveTabText = `${StatusTabLabel.All} ${tabs.all.count}`;
    const sumOfOtherTabs = tabs.planned.count + tabs.inProgress.count + tabs.completed.count + tabs.archived.count;

    await expect(statusTabs.activeTab, `Aktywna zakładka to „${expectedActiveTabText}”`).toHaveText(expectedActiveTabText);
    await expect(tabs.all.count, "Licznik „Wszystkie” jest sumą pozostałych liczników").toBe(sumOfOtherTabs);

    return tabs;
  });

  const allCards = await myTripsPage.getAllTripCards();

  await test.step("Zweryfikuj sortowanie kart", async () => {
    const expectedCardsOrder = getExpectedCardsOrder(allCards);
    await expect(allCards, "Karty są posortowane według statusu i daty od").toEqual(expectedCardsOrder);
  });

  await test.step("Zweryfikuj widoczność zawartości kart", async () => {
    for (const status of await tripCardStatuses.all()) {
      await expect(status).toBeVisible();
    }

    for (const name of await tripCardNames.all()) {
      await expect(name).toBeVisible();
    }

    for (const details of await tripCardDetails.all()) {
      await expect(details).toBeVisible();
    }
  });

  await test.step("Zweryfikuj, że dodane podróże są na liście", async () => {
    const tripNames = allCards.map((card) => card.tripName);

    await expect(tripNames).toContain(plannedTrip.name);
    await expect(tripNames).toContain(inProgressTrip.name);
    await expect(tripNames).toContain(completedTrip.name);
  });

  await test.step("Zweryfikuj widget najbliższej podróży", async () => {
    const expectedCountdown = getExpectedCountdownForNearestTrip(allCards);

    await expect(nextTripCountdown, `Odliczanie zawiera „${expectedCountdown}”`).toContainText(expectedCountdown);
  });

  await statusTabs.clickPlannedTab();
  const plannedCards = await myTripsPage.getAllTripCards();
  await test.step("Zweryfikuj zakładkę W planie", async () => {
    await verifyCardsInTab(plannedCards, TripStatusLabel.Planned, initialTabs.planned.count, plannedTrip.name);
  });

  await statusTabs.clickInProgressTab();
  const inProgressCards = await myTripsPage.getAllTripCards();
  await test.step("Zweryfikuj zakładkę W trakcie", async () => {
    await verifyCardsInTab(inProgressCards, TripStatusLabel.InProgress, initialTabs.inProgress.count, inProgressTrip.name);
  });

  await statusTabs.clickCompletedTab();
  const completedCards = await myTripsPage.getAllTripCards();
  await test.step("Zweryfikuj zakładkę Zrealizowane", async () => {
    await verifyCardsInTab(completedCards, TripStatusLabel.Completed, initialTabs.completed.count, completedTrip.name);
  });

  await test.step("Przenieś podróż do archiwum i wróć na listę", async () => {
    const completedTripPage = await myTripsPage.clickTripCard(completedTrip.name);
    await completedTripPage.clickArchiveButton();
    await expect(completedTripPage.readOnlyNotice).toBeVisible();
    myTripsPage = await completedTripPage.clickBackLink();
    await expect(newTripButton).toBeVisible();
    await expect(loadingText).toBeHidden();
  });

  const tabsAfterArchive = await statusTabs.getTabs();

  await test.step("Zweryfikuj liczniki po przeniesieniu do archiwum", async () => {
    await expect(tabsAfterArchive.all.count).toBe(initialTabs.all.count);
    await expect(tabsAfterArchive.planned.count).toBe(initialTabs.planned.count);
    await expect(tabsAfterArchive.inProgress.count).toBe(initialTabs.inProgress.count);
    await expect(tabsAfterArchive.completed.count).toBe(initialTabs.completed.count - 1);
    await expect(tabsAfterArchive.archived.count).toBe(initialTabs.archived.count + 1);
  });

  await statusTabs.clickArchivedTab();
  const archivedTrip = await myTripsPage.getTripCard(completedTrip.name);
  await test.step("Zweryfikuj zakładkę Archiwum", async () => {
    await expect(archivedTrip.status).toBe(TripStatusLabel.Archived);
  });

  await statusTabs.clickPlannedTab();
  const plannedTripPage = await myTripsPage.clickTripCard(plannedTrip.name);

  await test.step("Zweryfikuj szczegóły podróży", async () => {
    await expect(page).toHaveURL(`/podroze/${plannedTripId}`);
    await expect(plannedTripPage.tripTitle).toHaveText(plannedTrip.name);
    await expect(plannedTripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
  });
});

async function verifyStatusTabsVisible(statusTabs: StatusTabsComponent): Promise<void> {
  await expect(statusTabs.allTab).toBeVisible();
  await expect(statusTabs.plannedTab).toBeVisible();
  await expect(statusTabs.inProgressTab).toBeVisible();
  await expect(statusTabs.completedTab).toBeVisible();
  await expect(statusTabs.archivedTab).toBeVisible();
}

async function verifyCardsInTab(
  cards: TripCardModel[],
  expectedStatus: TripStatusLabel,
  expectedCount: number,
  expectedTripName: string,
): Promise<void> {
  const tripNames = cards.map((card) => card.tripName);

  await expect(cards.length, "Liczba kart jest zgodna z licznikiem zakładki").toBe(expectedCount);
  await expect(tripNames).toContain(expectedTripName);

  for (const card of cards) {
    await expect(card.status).toBe(expectedStatus);
  }
}
