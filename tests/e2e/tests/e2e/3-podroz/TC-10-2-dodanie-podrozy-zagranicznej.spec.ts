import { TripCharacterId, TripStatusLabel, TripType } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { tripCharacterOptions, tripTypeOptions } from "@_src/test-data/trip-form.data";
import { foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedTripCard, getExpectedTripDetails } from "@_src/utils/trip.util";

test("TC-10-2 Użytkownik dodaje podróż zagraniczną przez formularz @logged", async ({ myTripsPage, tripsApi, page }) => {
  const trip = prepareTrip(foreignTripData);
  tripsApi.addTripToCleanup(trip.name);
  const expectedFormHeading = "Nowa podróż";
  const expectedCard = getExpectedTripCard(trip, TripStatusLabel.Planned);
  const expectedDetails = getExpectedTripDetails(trip, TripStatusLabel.Planned);

  const initialTabs = await test.step("Zweryfikuj załadowanie listy i odczytaj liczniki", async () => {
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    return myTripsPage.statusTabs.getTabs();
  });

  const tripFormPage = await myTripsPage.clickNewTripButton();

  await test.step("Zweryfikuj formularz nowej podróży", async () => {
    await expect(page).toHaveURL(tripFormPage.url);
    await expect(tripFormPage.heading).toHaveText(expectedFormHeading);
    await expect(tripFormPage.typeSelect, "Domyślny typ nowej podróży to „Zagraniczna”").toHaveValue(TripType.Foreign);
    await expect(tripFormPage.characterSelect, "Domyślny charakter nowej podróży to „Miasto”").toHaveValue(
      String(TripCharacterId.City),
    );
    await expect(tripFormPage.typeOptions).toHaveText(tripTypeOptions);
    await expect(tripFormPage.characterOptions).toHaveText(tripCharacterOptions);
  });

  myTripsPage = await tripFormPage.createTrip(trip);

  await test.step("Zweryfikuj powrót na listę i liczniki", async () => {
    await expect(page).toHaveURL(myTripsPage.url);
    await expect(myTripsPage.newTripButton).toBeVisible();
    await expect(myTripsPage.loadingText).toBeHidden();

    const tabs = await myTripsPage.statusTabs.getTabs();
    await expect(tabs.all.count).toBe(initialTabs.all.count + 1);
    await expect(tabs.planned.count).toBe(initialTabs.planned.count + 1);
    await expect(tabs.inProgress.count).toBe(initialTabs.inProgress.count);
    await expect(tabs.completed.count).toBe(initialTabs.completed.count);
    await expect(tabs.archived.count).toBe(initialTabs.archived.count);
  });

  const card = await myTripsPage.getTripCard(trip.name);

  await test.step("Zweryfikuj kartę podróży", async () => {
    await expect(card).toEqual(expectedCard);
  });

  const tripPage = await myTripsPage.clickTripCard(trip.name);

  await test.step("Zweryfikuj szczegóły podróży", async () => {
    await expect(tripPage.tripTitle).toHaveText(trip.name);

    const tripDetails = await tripPage.getTripDetails();
    await expect(tripDetails).toEqual(expectedDetails);
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
    await expect(tripPage.startTripButton).toBeVisible();
  });
});
