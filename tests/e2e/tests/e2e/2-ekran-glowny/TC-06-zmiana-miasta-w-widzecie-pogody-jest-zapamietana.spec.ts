import { expect, test } from "@_src/fixtures/merge.fixture";
import { testUser1 } from "@_src/test-data/user.data";
import { getExpectedCityName, getExpectedSearchResultLabel } from "@_src/utils/weather.util";

test.use({ trace: "off" });

test("TC-06 Po zmianie miasta w widżecie pogody, wybór zostaje zapamiętany @logged", async ({
  myTripsPage,
  widgetsApi,
}) => {
  const tooShortQuery = "K";
  const unknownCity = "Qwxzyv";
  const cityQuery = "Kraków";

  const initialCity = await widgetsApi.rememberWeatherCityToRestore();
  const foundCities = await widgetsApi.searchCities(cityQuery);
  const [chosenCity] = foundCities;

  const expectedInitialCityName = getExpectedCityName(initialCity);
  const expectedSearchResults = foundCities.map((city) => getExpectedSearchResultLabel(city));
  const expectedChosenCityOption = getExpectedSearchResultLabel(chosenCity);
  const expectedChosenCityName = getExpectedCityName(chosenCity);
  const expectedTemperatureUnit = "°C";
  const expectedApparentTemperatureLabel = "Odczuwalna";
  const expectedWindLabel = "wiatr";
  const expectedTooShortQueryError = "Wpisz co najmniej 2 litery nazwy miasta.";
  const expectedUnknownCityError = `Nie znaleziono miasta „${unknownCity}”.`;

  await myTripsPage.goto();
  const { weatherWidget } = myTripsPage;

  await test.step("Zweryfikuj pogodę dla miasta zapisanego w ustawieniach", async () => {
    await expect(weatherWidget.cityName, "Miasto powinno być takie jak w ustawieniach użytkownika").toHaveText(
      expectedInitialCityName,
    );
    await expect(weatherWidget.currentWeather).toContainText(expectedTemperatureUnit);
    await expect(weatherWidget.currentWeather).toContainText(expectedApparentTemperatureLabel);
    await expect(weatherWidget.currentWeather).toContainText(expectedWindLabel);
  });

  await weatherWidget.searchCity(tooShortQuery);

  await test.step("Zweryfikuj błąd zbyt krótkiej nazwy miasta", async () => {
    await expect(weatherWidget.searchError).toHaveText(expectedTooShortQueryError);
    await expect(weatherWidget.cityName).toHaveText(expectedInitialCityName);
  });

  await weatherWidget.searchCity(unknownCity);

  await test.step("Zweryfikuj błąd nieznalezionego miasta", async () => {
    await expect(weatherWidget.searchError).toHaveText(expectedUnknownCityError);
  });

  await weatherWidget.searchCity(cityQuery);

  await test.step(`Zweryfikuj listę miast dla „${cityQuery}”`, async () => {
    await expect(weatherWidget.cityOptions, "Lista miast powinna być taka jak w API wyszukiwania").toHaveText(
      expectedSearchResults,
    );
    await expect(weatherWidget.searchError).toBeHidden();
  });

  await weatherWidget.clickCityOption(expectedChosenCityOption);

  const chosenCityWeather = await test.step("Zweryfikuj pogodę dla wybranego miasta i ją odczytaj", async () => {
    await expect(weatherWidget.cityResults).toBeHidden();
    await expect(weatherWidget.cityInput).toHaveValue("");
    await expect(weatherWidget.cityName).toHaveText(expectedChosenCityName);
    await expect(weatherWidget.currentWeather).toContainText(expectedTemperatureUnit);

    return weatherWidget.getWeather();
  });

  await myTripsPage.reload();

  await test.step("Zweryfikuj pogodę po odświeżeniu strony", async () => {
    await expect(weatherWidget.cityName).toHaveText(expectedChosenCityName);

    const weatherAfterReload = await weatherWidget.getWeather();
    await expect(weatherAfterReload, "Po odświeżeniu widżet powinien pokazywać tę samą pogodę").toEqual(
      chosenCityWeather,
    );
  });

  const loginPage = await myTripsPage.mainMenu.clickLogoutButton();
  myTripsPage = await loginPage.login(testUser1);

  await test.step("Zweryfikuj pogodę po ponownym zalogowaniu", async () => {
    await expect(myTripsPage.weatherWidget.cityName, "Wybór miasta powinien być zapisany w ustawieniach użytkownika").toHaveText(
      expectedChosenCityName,
    );

    const weatherAfterLogin = await myTripsPage.weatherWidget.getWeather();
    await expect(weatherAfterLogin, "Po ponownym zalogowaniu widżet powinien pokazywać tę samą pogodę").toEqual(
      chosenCityWeather,
    );
  });
});
