export interface WeatherCityModel {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CitySearchResultModel extends WeatherCityModel {
  region: string | null;
}
