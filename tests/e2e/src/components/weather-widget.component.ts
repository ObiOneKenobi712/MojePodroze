import { WeatherWidgetModel } from "@_src/models/weather-widget.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class WeatherWidgetComponent {
  container: Locator;
  title: Locator;
  currentWeather: Locator;
  cityName: Locator;
  cityInput: Locator;
  searchButton: Locator;
  searchError: Locator;
  cityResults: Locator;
  cityOptions: Locator;

  constructor(private page: Page) {
    this.container = this.page.getByTestId("widget-weather");
    this.title = this.container.getByRole("heading");
    this.currentWeather = this.page.getByTestId("weather-current");
    this.cityName = this.page.getByTestId("weather-city-name");
    this.cityInput = this.page.getByTestId("input-weather-city");
    this.searchButton = this.page.getByTestId("btn-weather-search");
    this.searchError = this.page.getByTestId("weather-search-error");
    this.cityResults = this.page.getByTestId("weather-city-results");
    this.cityOptions = this.cityResults.getByRole("button");
  }

  getCityOption(label: string): Locator {
    return this.cityResults.getByRole("button", { name: label, exact: true });
  }

  @step("Odczytaj pogodę z widżetu")
  async getWeather(): Promise<WeatherWidgetModel> {
    const [cityName, weather, details] = await this.currentWeather.getByRole("paragraph").allTextContents();

    return { cityName, weather, details: details ?? "" };
  }

  @step((query: string) => `Wyszukaj miasto „${query}” w widżecie pogody`)
  async searchCity(query: string): Promise<void> {
    await this.cityInput.fill(query);
    await this.searchButton.click();
  }

  @step((label: string) => `Wybierz miasto „${label}”`)
  async clickCityOption(label: string): Promise<void> {
    await this.getCityOption(label).click();
  }
}
