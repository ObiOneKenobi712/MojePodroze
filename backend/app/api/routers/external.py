"""Funkcje korzystające z zewnętrznych API (Open-Meteo, NBP, Wikipedia).

Przy awarii zewnętrznego API endpoint zwraca 503 EXTERNAL_API_UNAVAILABLE, a GUI pokazuje
komunikat tylko w danym widżecie.
"""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CityImageClient, CurrentUser, OwnedTrip, RatesClient, WeatherClient
from app.api.responses import EXTERNAL, NOT_FOUND, UNAUTHORIZED, VALIDATION
from app.core.errors import NotFoundError
from app.domain.currency import convert_to_pln
from app.domain.enums import Currency
from app.schemas.external import (
    CityImageOut,
    CityOut,
    ConversionOut,
    CurrentWeatherOut,
    ExchangeRatesOut,
    WeatherOut,
)
from app.schemas.users import UserProfileOut

router = APIRouter(responses={**UNAUTHORIZED, **EXTERNAL})


@router.get(
    "/weather/cities",
    tags=["Pogoda"],
    summary="Wyszukaj miasto (pole wyszukiwania w widżecie)",
    responses=VALIDATION,
    name="search_cities",
)
def search_cities(
    _user: CurrentUser,
    weather: WeatherClient,
    query: Annotated[str, Query(min_length=2, max_length=100, description="Fragment nazwy.")],
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
) -> list[CityOut]:
    return [CityOut.model_validate(city) for city in weather.search_cities(query.strip(), limit)]


@router.get(
    "/weather/current",
    tags=["Pogoda"],
    summary="Bieżąca pogoda dla miasta wybranego przez użytkownika",
    description="Miasto zmienia się przez PUT /api/users/me/weather-city (domyślnie Warszawa).",
    name="get_current_weather",
)
def get_current_weather(user: CurrentUser, weather: WeatherClient) -> WeatherOut:
    current = weather.current_weather(user.weather_latitude, user.weather_longitude)
    return WeatherOut(
        city=UserProfileOut.from_user(user).weather_city,
        weather=CurrentWeatherOut.model_validate(current),
    )


@router.get(
    "/exchange-rates",
    tags=["Kursy walut"],
    summary="Kursy EUR, USD i GBP do PLN (tabela A NBP)",
    name="get_exchange_rates",
)
def get_exchange_rates(_user: CurrentUser, rates: RatesClient) -> ExchangeRatesOut:
    return ExchangeRatesOut.model_validate(rates.get_rates())


@router.get(
    "/exchange-rates/convert",
    tags=["Kursy walut"],
    summary="Kalkulator walut → PLN",
    description="Przelicza kwotę po kursie średnim NBP. Niczego nie zapisuje.",
    responses=VALIDATION,
    name="convert_currency",
)
def convert_currency(
    _user: CurrentUser,
    rates: RatesClient,
    amount: Annotated[Decimal, Query(ge=0, le=1_000_000_000, decimal_places=2)],
    currency: Annotated[Currency, Query(description="EUR, USD albo GBP.")],
) -> ConversionOut:
    table = rates.get_rates()
    rate = table.rate_for(currency.value).mid
    return ConversionOut(
        amount=amount,
        currency=currency,
        rate=rate,
        amount_pln=convert_to_pln(amount, rate),
        effective_date=table.effective_date,
    )


@router.get(
    "/trips/{trip_id}/city-image",
    tags=["Zdjęcie miasta"],
    summary="Zdjęcie miasta celu podróży z Wikipedii",
    description=(
        "Miniatura z polskiego artykułu o mieście `destination_city`. Brak artykułu albo zdjęcia "
        "→ 404 NOT_FOUND (GUI zostawia kolor). Pod zdjęciem trzeba pokazać link `source_url`."
    ),
    responses=NOT_FOUND,
    name="get_trip_city_image",
)
def get_trip_city_image(trip: OwnedTrip, images: CityImageClient) -> CityImageOut:
    image = images.city_image(trip.destination_city)
    if image is None:
        raise NotFoundError("Nie znaleziono zdjęcia miasta w Wikipedii.")
    return CityImageOut.model_validate(image)
