import { TRIP_STATUS_LABELS } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { TripStatus } from "@_src/models/trip.model";
import { domesticTripData } from "@_src/test-data/trip.data";

test("TC-10-5 Użytkownik usuwa podróże krajowe o wszystkich statusach, oprócz archiwum @logged", async ({
  myTripsPage,
  tripsApi,
  page,
}) => {
  const statusesToDelete: TripStatus[] = ["planned", "in_progress", "completed"];
  const expectedDialogTitle = "Usunąć podróż?";
  const expectedNotFoundMessage = "Nie znaleziono podróży.";

  for (const status of statusesToDelete) {
    const trip = prepareTrip(domesticTripData);
    const tripId = await tripsApi.createTrip(trip, status);
    const statusLabel = TRIP_STATUS_LABELS[status];
    const expectedDialogMessage = `„${trip.name}” zostanie usunięta razem ze wszystkimi wpisami i zdjęciami. Tego nie da się cofnąć.`;

    await myTripsPage.goto();
    const initialTabs = await test.step(`Zweryfikuj załadowanie listy i odczytaj liczniki – ${statusLabel}`, async () => {
      await expect(myTripsPage.newTripButton).toBeVisible();
      await expect(myTripsPage.loadingText).toBeHidden();

      return myTripsPage.statusTabs.getTabs();
    });

    const tripPage = await myTripsPage.clickTripCard(trip.name);
    const deleteTripDialog = await tripPage.clickDeleteButton();

    await test.step(`Zweryfikuj okno potwierdzenia – ${statusLabel}`, async () => {
      await expect(deleteTripDialog.dialog).toBeVisible();
      await expect(deleteTripDialog.title).toHaveText(expectedDialogTitle);
      await expect(deleteTripDialog.message).toHaveText(expectedDialogMessage);
    });

    myTripsPage = await deleteTripDialog.confirmDelete();

    await test.step(`Zweryfikuj usunięcie podróży – ${statusLabel}`, async () => {
      await expect(page).toHaveURL(myTripsPage.url);
      await expect(myTripsPage.newTripButton).toBeVisible();
      await expect(myTripsPage.loadingText).toBeHidden();

      const tripNames = (await myTripsPage.getAllTripCards()).map((card) => card.tripName);
      const tabs = await myTripsPage.statusTabs.getTabs();

      await expect(tripNames).not.toContain(trip.name);
      await expect(tabs.all.count).toBe(initialTabs.all.count - 1);
    });

    await tripPage.goto(`/${tripId}`);

    await test.step(`Zweryfikuj, że usuniętej podróży nie da się otworzyć – ${statusLabel}`, async () => {
      await expect(tripPage.loadErrorText).toContainText(expectedNotFoundMessage);
    });
  }
});
