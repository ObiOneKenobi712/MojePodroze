import { ExchangeRatesModel } from "@_src/models/exchange-rates.model";
import { CitySearchResultModel, WeatherCityModel } from "@_src/models/weather-city.model";
import { step } from "@_src/utils/step.decorator";
import { APIRequestContext, expect } from "@playwright/test";

export class WidgetsApi {
  headers: { "X-User-Id": string };
  weatherCityToRestore: WeatherCityModel | null = null;

  constructor(
    private request: APIRequestContext,
    userId: string,
  ) {
    this.headers = { "X-User-Id": userId };
  }

  @step("Pobierz przez API kursy walut NBP")
  async getExchangeRates(): Promise<ExchangeRatesModel> {
    const response = await this.request.get("/api/exchange-rates", { headers: this.headers });
    expect(response.status()).toBe(200);

    return response.json();
  }

  @step("Pobierz przez API miasto z widżetu pogody")
  async getWeatherCity(): Promise<WeatherCityModel> {
    const response = await this.request.get("/api/users/me", { headers: this.headers });
    expect(response.status()).toBe(200);

    const user = await response.json();
    return user.weather_city;
  }

  @step((query: string) => `Wyszukaj przez API miasto „${query}”`)
  async searchCities(query: string): Promise<CitySearchResultModel[]> {
    const response = await this.request.get("/api/weather/cities", {
      headers: this.headers,
      params: { query, limit: 5 },
    });
    expect(response.status()).toBe(200);

    return response.json();
  }

  @step((city: WeatherCityModel) => `Ustaw przez API miasto „${city.name}” w widżecie pogody`)
  async setWeatherCity(city: WeatherCityModel): Promise<void> {
    const response = await this.request.put("/api/users/me/weather-city", {
      headers: this.headers,
      data: { name: city.name, country: city.country, latitude: city.latitude, longitude: city.longitude },
    });
    expect(response.status()).toBe(200);
  }

  async rememberWeatherCityToRestore(): Promise<WeatherCityModel> {
    this.weatherCityToRestore = await this.getWeatherCity();
    return this.weatherCityToRestore;
  }

  @step("Przywróć przez API miasto sprzed testu w widżecie pogody")
  async restoreWeatherCity(): Promise<void> {
    if (this.weatherCityToRestore !== null) {
      await this.setWeatherCity(this.weatherCityToRestore);
    }
  }
}
