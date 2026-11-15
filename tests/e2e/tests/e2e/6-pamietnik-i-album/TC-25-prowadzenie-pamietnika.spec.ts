import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { DiaryEntryFormModel } from "@_src/models/diary-entry-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate, getExpectedDayHeading, getTripDayDate } from "@_src/utils/date.util";

test("TC-25 Użytkownik prowadzi pamiętnik – wpisy grupują się według dni @logged", async ({ myTripsPage, tripsApi }) => {
  const trip = prepareTrip(domesticTripData);
  const day1 = getTripDayDate(trip.start_date, 1);
  const day2 = getTripDayDate(trip.start_date, 2);
  const day3 = getTripDayDate(trip.start_date, 3);
  const walkTitle = "Spacer po Starówce";
  const morningLine = "Rano Długi Targ.";
  const afternoonLine = "Po południu Westerplatte.";
  const walkEntry: DiaryEntryFormModel = {
    date: day2,
    title: walkTitle,
    content: `${morningLine}\n${afternoonLine}`,
  };
  const arrivalEntry: DiaryEntryFormModel = { 
    date: day1, 
    content: "Przyjazd pociągiem, wieczorem molo." 
  };
  const arrivalTitle = "Przyjazd";
  const cruiseEntry: DiaryEntryFormModel = {
    date: day3,
    title: "Rejs na Hel",
    content: "Statkiem z Gdańska na Hel, foki w fokarium.",
  };

  const expectedEmptyText = "Pamiętnik jest pusty. Zapisz pierwsze wrażenia z podróży.";
  const expectedNewFormTitle = "Nowy wpis";
  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedContentError = "Napisz treść wpisu.";
  const expectedDeleteDialogTitle = "Usunąć wpis?";
  const expectedDeleteDialogMessage = `Wpis „${walkTitle}” (${formatTripCardDate(day2)}) zniknie z listy.`;

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { diarySection } = tripPage;

  await tripPage.sectionTabs.clickTab(TripSectionTab.Diary);

  await test.step("Zweryfikuj pusty pamiętnik", async () => {
    await expect(diarySection.emptyText).toHaveText(expectedEmptyText);
    await expect(diarySection.addButton).toBeVisible();
  });

  await diarySection.clickAddButton();

  await test.step("Zweryfikuj formularz nowego wpisu", async () => {
    await expect(diarySection.formTitle).toHaveText(expectedNewFormTitle);
    await expect(diarySection.dateInput).toHaveValue(day1);
    await expect(diarySection.titleInput).toBeVisible();
    await expect(diarySection.contentInput).toBeVisible();
  });

  await diarySection.clickSaveButton();

  await test.step("Zweryfikuj błąd pustej treści", async () => {
    await expect(diarySection.formError).toHaveText(expectedFormError);
    await expect(diarySection.contentError).toHaveText(expectedContentError);
  });

  await diarySection.fillForm(walkEntry);
  await diarySection.clickSaveButton();

  await test.step("Zweryfikuj wpis w grupie dnia 2", async () => {
    const day2Group = diarySection.getDayGroup(day2);

    await expect(diarySection.getDayHeading(day2)).toHaveText(getExpectedDayHeading(2, day2));
    await expect(day2Group).toContainText(walkTitle);
    await expect(day2Group).toContainText(morningLine);
    await expect(day2Group).toContainText(afternoonLine);
  });

  await diarySection.addDiaryEntry(cruiseEntry);

  await test.step("Zweryfikuj wpis w grupie dnia 3", async () => {
    await expect(diarySection.getDayHeading(day3)).toHaveText(getExpectedDayHeading(3, day3));
    await expect(diarySection.getDayGroup(day3)).toContainText(cruiseEntry.content);
  });

  await diarySection.addDiaryEntry(arrivalEntry);

  await test.step("Zweryfikuj kolejność dni i wpis bez tytułu", async () => {
    await expect(diarySection.dayHeadings).toHaveText([
      getExpectedDayHeading(1, day1),
      getExpectedDayHeading(2, day2),
      getExpectedDayHeading(3, day3),
    ]);
    await expect(diarySection.getDayGroup(day1)).toContainText(arrivalEntry.content);
  });

  await diarySection.editDiaryEntryInDay(day1, { ...arrivalEntry, title: arrivalTitle });

  await test.step("Zweryfikuj tytuł dopisany przy edycji", async () => {
    await expect(diarySection.getItemByTitle(arrivalTitle)).toBeVisible();
  });

  const deleteDialog = await diarySection.clickDeleteItemButton(walkTitle);

  await test.step("Zweryfikuj okno usuwania wpisu", async () => {
    await expect(deleteDialog.title).toHaveText(expectedDeleteDialogTitle);
    await expect(deleteDialog.message).toHaveText(expectedDeleteDialogMessage);
  });

  await deleteDialog.clickConfirmButton();

  await test.step("Zweryfikuj usunięcie wpisu i grupy dnia 2", async () => {
    await expect(diarySection.getDayGroup(day2)).toBeHidden();
    await expect(diarySection.dayHeadings).toHaveText([getExpectedDayHeading(1, day1), getExpectedDayHeading(3, day3)]);
    await expect(diarySection.getItemByTitle(arrivalTitle)).toBeVisible();
  });
});
