import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { PlanPointFormModel } from "@_src/models/plan-point-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { getExpectedDayHeading, getTripDayDate } from "@_src/utils/date.util";

test("TC-16 Punkty planu dnia grupują się według dni i układają według godziny @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  const trip = prepareTrip(domesticTripData);
  const day1 = getTripDayDate(trip.start_date, 1);
  const day2 = getTripDayDate(trip.start_date, 2);
  const day3 = getTripDayDate(trip.start_date, 3);
  const westerplatte: PlanPointFormModel = { 
    place: "Westerplatte", 
    day: day2, 
    time: "14:00" };
  const dlugiTarg: PlanPointFormModel = {
    place: "Długi Targ",
    day: day2,
    time: "09:30",
    description: "Spacer po Starym Mieście",
  };
  const molo: PlanPointFormModel = { 
    place: "Molo w Sopocie", 
    day: day1 };

  const expectedEmptyText = "Plan jest pusty. Dodaj pierwszy punkt – miejsce i dzień, a godzinę, jeśli ją znasz.";
  const expectedNewFormTitle = "Nowy punkt planu";
  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedPlaceError = "Podaj miejsce.";
  const expectedNoTimeText = "bez godziny";

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { planSection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Plan);

  await test.step("Zweryfikuj pusty plan dnia podróży", async () => {
    await expect(planSection.emptyText).toHaveText(expectedEmptyText);
  });

  await planSection.clickAddButton();

  await test.step("Zweryfikuj formularz nowego punktu w planie", async () => {
    await expect(planSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(planSection.dayInput).toHaveValue(day1);
  });

  await planSection.clickSaveButton();

  await test.step("Zweryfikuj błędy w formularzu dodania nowego punktu planu", async () => {
    await expect(planSection.formError).toHaveText(expectedFormError);
    await expect(planSection.placeError).toHaveText(expectedPlaceError);
  });

  await planSection.fillForm(westerplatte);
  await planSection.clickSaveButton();
  await planSection.addPlanPoint(dlugiTarg);
  await planSection.addPlanPoint(molo);

  await test.step("Zweryfikuj grupowanie punktów według dni i godzin", async () => {
    await expect(planSection.form).toBeHidden();
    await expect(planSection.getDayHeading(day1)).toHaveText(getExpectedDayHeading(1, day1));
    await expect(planSection.getDayItems(day1)).toContainText([molo.place]);
    await expect(planSection.getDayItems(day1)).toContainText([expectedNoTimeText]);
    await expect(planSection.getDayHeading(day2)).toHaveText(getExpectedDayHeading(2, day2));
    await expect(planSection.getDayItems(day2)).toContainText([dlugiTarg.place, westerplatte.place]);
    await expect(planSection.getItemByTitle(dlugiTarg.place)).toContainText(dlugiTarg.description ?? "");
  });

  await planSection.editPlanPoint(westerplatte.place, { ...westerplatte, time: "08:00" });

  await test.step("Zweryfikuj nową kolejność punktów w dniu 2", async () => {
    await expect(planSection.getDayItems(day2)).toContainText([westerplatte.place, dlugiTarg.place]);
  });

  await planSection.clickCopyItemButton(molo.place);

  await test.step("Zweryfikuj formularz kopii punktu", async () => {
    await expect(planSection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(planSection.placeInput).toHaveValue(molo.place);
  });

  await planSection.fillForm({ ...molo, day: day3 });
  await planSection.clickSaveButton();

  await test.step("Zweryfikuj kopię punktu w dniu 3", async () => {
    await expect(planSection.getDayItems(day3)).toContainText([molo.place]);
    await expect(planSection.getDayItems(day1)).toContainText([molo.place]);
  });

  const deleteDialog = await planSection.clickDeleteButtonInDay(molo.place, day3);
  await deleteDialog.clickConfirmButton();

  await test.step("Zweryfikuj usunięcie punktu z dnia 3", async () => {
    await expect(planSection.getDayGroup(day3)).toBeHidden();
    await expect(planSection.getDayItems(day1)).toContainText([molo.place]);
  });
});
