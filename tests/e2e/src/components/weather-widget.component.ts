import { Locator, Page } from '@playwright/test';

export class WeatherWidgetComponent {
  container: Locator;
  title: Locator;
  currentWeather: Locator;
  cityInput: Locator;
  searchButton: Locator;

  constructor(private page: Page) {
    this.container = this.page.getByTestId('widget-weather');
    this.title = this.container.getByRole('heading');
    this.currentWeather = this.page.getByTestId('weather-current');
    this.cityInput = this.page.getByTestId('input-weather-city');
    this.searchButton = this.page.getByTestId('btn-weather-search');
  }
}
