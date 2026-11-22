import { TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { domesticTripData } from "@_src/test-data/trip.data";

test("TC-13 Status podróży zmienia się tylko o jeden etap do przodu lub wstecz @logged", async ({ myTripsPage, tripsApi }) => {
  const trip = prepareTrip(domesticTripData);
  const expectedReadOnlyNotice = "Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.";

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  let tripPage = await myTripsPage.clickTripCard(trip.name);

  await test.step("Zweryfikuj status W planie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
    await expect(tripPage.startTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  await tripPage.clickStartTripButton();

  await test.step("Zweryfikuj status W trakcie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.InProgress);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.completeTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.InProgress);

  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  await test.step("Zweryfikuj powrót do statusu W planie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
    await expect(tripPage.startTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Planned);

  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickStartTripButton();
  await tripPage.clickCompleteTripButton();

  await test.step("Zweryfikuj status Zrealizowana", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.archiveButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Completed);

  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  await test.step("Zweryfikuj powrót do statusu W trakcie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.InProgress);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.completeTripButton).toBeEnabled();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.InProgress);

  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickCompleteTripButton();
  await tripPage.clickArchiveButton();

  await test.step("Zweryfikuj status Archiwum", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Archived);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.readOnlyNotice).toHaveText(expectedReadOnlyNotice);
    await expect(tripPage.editButton).toBeHidden();
    await expect(tripPage.deleteButton).toBeHidden();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Archived);

  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  await test.step("Zweryfikuj powrót z archiwum do statusu Zrealizowana", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.archiveButton).toBeEnabled();
    await expect(tripPage.readOnlyNotice).toBeHidden();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Completed);
});

async function verifyTripOnList(myTripsPage: MyTripsPage, tripName: string, expectedStatus: TripStatusLabel): Promise<void> {
  await test.step(`Zweryfikuj podróż na liście ze statusem „${expectedStatus}”`, async () => {
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    const card = await myTripsPage.getTripCard(tripName);
    await expect(card.status).toBe(expectedStatus);

    await myTripsPage.statusTabs.clickTabForStatus(expectedStatus);
    const tripNamesInTab = (await myTripsPage.getAllTripCards()).map((tripCard) => tripCard.tripName);
    await expect(tripNamesInTab).toContain(tripName);
  });
}
