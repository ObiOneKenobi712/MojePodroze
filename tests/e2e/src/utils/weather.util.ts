import { CitySearchResultModel, WeatherCityModel } from "@_src/models/weather-city.model";

export function getExpectedCityName(city: WeatherCityModel): string {
  if (city.country === null) {
    return city.name;
  }

  return `${city.name}, ${city.country}`;
}

export function getExpectedSearchResultLabel(city: CitySearchResultModel): string {
  const parts = [city.name];

  if (city.region !== null) {
    parts.push(city.region);
  }

  if (city.country !== null) {
    parts.push(city.country);
  }

  return parts.join(", ");
}
