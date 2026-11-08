import { expect, test } from "@_src/fixtures/merge.fixture";

test("Widok Moje podróże zawiera menu, zakładki i widgety @smoke @logged", async ({ myTripsPage }) => {
  const { mainMenu, statusTabs, weatherWidget, ratesWidget, newTripButton, searchInput } = myTripsPage;

  const expectedAppName = "Moje podróże";
  const expectedStatusTabs = ["Wszystkie", "W planie", "W trakcie", "Zrealizowane", "Archiwum"];
  const expectedWeatherTitle = "Pogoda";
  const expectedRatesTitle = "Kursy NBP";

  await test.step("Zweryfikuj menu główne", async () => {
    await expect(mainMenu.logoLink).toBeVisible();
    await expect(mainMenu.myTripsTab).toBeVisible();
    await expect(mainMenu.activeTab, `Aktywna zakładka to „${expectedAppName}”`).toHaveText(expectedAppName);
    await expect(mainMenu.statsTab).toBeVisible();
    await expect(mainMenu.logoutButton).toBeVisible();
  });

  await test.step("Zweryfikuj wyszukiwarkę i przycisk nowej podróży", async () => {
    await expect(searchInput).toBeVisible();
    await expect(newTripButton).toBeVisible();
  });

  await test.step("Zweryfikuj zakładki statusów", async () => {
    await expect(statusTabs.tabs, "Zakładki statusów mają właściwe nazwy i kolejność").toContainText(expectedStatusTabs);
  });

  await test.step("Zweryfikuj widget pogody", async () => {
    await expect(weatherWidget.title).toHaveText(expectedWeatherTitle);
    await expect(weatherWidget.currentWeather).toBeVisible();
    await expect(weatherWidget.cityInput).toBeVisible();
    await expect(weatherWidget.searchButton).toBeVisible();
  });

  await test.step("Zweryfikuj widget kursów NBP", async () => {
    await expect(ratesWidget.title).toHaveText(expectedRatesTitle);
    await expect(ratesWidget.ratesList).toBeVisible();
    await expect(ratesWidget.amountInput).toBeVisible();
  });
});
