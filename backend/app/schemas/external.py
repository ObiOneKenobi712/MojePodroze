"""Widżety ekranu głównego: pogoda i kursy walut."""

from datetime import date

from pydantic import BaseModel, Field

from app.domain.enums import Currency
from app.schemas.common import ApiModel, DecimalOut
from app.schemas.users import WeatherCity


class CityOut(ApiModel):
    name: str
    country: str | None
    region: str | None
    latitude: float
    longitude: float


class CurrentWeatherOut(ApiModel):
    temperature_c: float
    apparent_temperature_c: float | None
    relative_humidity: int | None
    wind_speed_kmh: float | None
    weather_code: int
    description: str
    is_day: bool | None
    observed_at: str


class WeatherOut(BaseModel):
    city: WeatherCity
    weather: CurrentWeatherOut


class ExchangeRateOut(ApiModel):
    code: str
    currency: str
    mid: DecimalOut


class ExchangeRatesOut(ApiModel):
    table_no: str
    effective_date: date
    rates: list[ExchangeRateOut]


class ConversionOut(BaseModel):
    amount: DecimalOut
    currency: Currency
    rate: DecimalOut
    amount_pln: DecimalOut
    effective_date: date


class CityImageOut(ApiModel):
    image_url: str = Field(description="Adres miniatury (zewnętrzny, bez nagłówka X-User-Id).")
    source_url: str = Field(description="Artykuł w Wikipedii – link „Źródło” pod zdjęciem.")
