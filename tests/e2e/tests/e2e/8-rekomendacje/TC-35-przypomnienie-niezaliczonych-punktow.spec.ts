import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip, prepareUniqueCity } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData } from "@_src/test-data/trip.data";

test("TC-35 Przypomnienie o niezaliczonych punktach przy kolejnej podróży do danego miasta @logged", async ({ myTripsPage, tripsApi }) => {
  const city = prepareUniqueCity("Kraków");
  const previousTrip = prepareTrip({ ...domesticTripData, name: "Kraków jesień", destination_city: city });
  const newTrip = prepareTrip({ ...domesticTripData, name: "Kraków znowu", destination_city: city });
  const pendingPlace = "Kopiec Kościuszki";
  const pendingPlaceLowerCase = "kopiec kościuszki";
  const visitedPlace = "Sukiennice";

  const previousTripId = await tripsApi.createTrip(previousTrip, "planned");
  await tripsApi.createWishlistItem(previousTripId, { name: pendingPlace }, false);
  await tripsApi.createWishlistItem(previousTripId, { name: visitedPlace }, true);
  await tripsApi.moveTripToStatus(previousTripId, "completed");
  await tripsApi.createTrip(newTrip, "planned");

  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(newTrip.name);
  const { sectionTabs, recommendations, wishlistSection } = tripPage;

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj przypomnienie niezaliczonego punktu", async () => {
    await expect(recommendations.pendingWishlistHeading).toBeVisible();
    await expect(recommendations.pendingWishlist).toHaveText([pendingPlace]);
  });

  await sectionTabs.clickTab(TripSectionTab.Wishlist);
  await wishlistSection.addItem({ name: pendingPlaceLowerCase });

  await test.step(`Zweryfikuj dodanie „${pendingPlaceLowerCase}” do bieżącej listy`, async () => {
    await expect(wishlistSection.getItemByName(pendingPlaceLowerCase)).toBeVisible();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj, że punkt z bieżącej listy nie jest przypominany", async () => {
    await expect(recommendations.previousTripsText).toContainText(previousTrip.name);
    await expect(recommendations.pendingWishlistHeading).toBeHidden();
    await expect(recommendations.pendingWishlist).toHaveCount(0);
  });

  await sectionTabs.clickTab(TripSectionTab.Wishlist);
  const deleteDialog = await wishlistSection.clickDeleteItemButton(pendingPlaceLowerCase);
  await deleteDialog.clickConfirmButton();

  await test.step(`Zweryfikuj usunięcie „${pendingPlaceLowerCase}” z bieżącej listy`, async () => {
    await expect(wishlistSection.getItemByName(pendingPlaceLowerCase)).toBeHidden();
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj ponowne przypomnienie po usunięciu z listy", async () => {
    await expect(recommendations.pendingWishlist).toHaveText([pendingPlace]);
  });
});
