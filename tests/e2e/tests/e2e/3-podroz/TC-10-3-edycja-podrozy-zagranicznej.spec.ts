import { TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData, foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedTripDetails } from "@_src/utils/trip.util";

test("TC-10-3 Użytkownik edytuje wszystkie pola podróży zagranicznej @logged", async ({
  myTripsPage,
  tripsApi,
  page,
}) => {
  const createdTrip = prepareTrip(foreignTripData);
  const editedTrip = prepareTrip(domesticTripData);
  tripsApi.addTripToCleanup(editedTrip.name);
  const expectedEditFormHeading = "Edytuj podróż";
  const expectedCancelButtonText = "Anuluj";
  const expectedSaveButtonText = "Zapisz zmiany";
  const expectedDetails = getExpectedTripDetails(editedTrip, TripStatusLabel.Planned);

  const tripId = await tripsApi.createTrip(createdTrip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(createdTrip.name);
  const editTripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj formularz edycji", async () => {
    await expect(page).toHaveURL(`/podroze/${tripId}/edycja`);
    await expect(editTripFormPage.heading).toHaveText(expectedEditFormHeading);
    await expect(editTripFormPage.nameInput).toHaveValue(createdTrip.name);
    await expect(editTripFormPage.cancelButton).toBeEnabled();
    await expect(editTripFormPage.cancelButton).toHaveText(expectedCancelButtonText);
    await expect(editTripFormPage.saveButton).toBeEnabled();
    await expect(editTripFormPage.saveButton).toHaveText(expectedSaveButtonText);

    const formValues = await editTripFormPage.getFormValues();
    await expect(formValues).toEqual(createdTrip);
  });

  const editedTripPage = await editTripFormPage.updateTrip(editedTrip);

  await test.step("Zweryfikuj zmienione dane podróży", async () => {
    await expect(editedTripPage.tripTitle).toHaveText(editedTrip.name);

    const tripDetails = await editedTripPage.getTripDetails();
    await expect(tripDetails).toEqual(expectedDetails);
  });
});
