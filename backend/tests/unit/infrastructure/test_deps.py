"""Fabryki zależności: klienci zewnętrznych API dostają adresy i timeout z ustawień."""

from datetime import date
from pathlib import Path

import httpx

from app.api.deps import (
    get_city_image_client,
    get_http_client,
    get_photo_storage,
    get_rates_client,
    get_today,
    get_weather_client,
)
from app.config import Settings
from app.integrations.nbp import NbpClient
from app.integrations.open_meteo import OpenMeteoClient
from app.integrations.wikipedia import WikipediaClient
from app.services.photo_storage import PhotoStorage


def make_settings(tmp_path: Path) -> Settings:
    return Settings(
        database_url="sqlite://",
        upload_dir=tmp_path,
        external_api_timeout_seconds=2.5,
        weather_api_url="https://forecast.test",
        geocoding_api_url="https://geo.test",
        nbp_api_url="https://nbp.test",
        wikipedia_summary_url="https://wiki.test/",
    )


def test_http_client_uses_configured_timeout_and_is_closed(tmp_path: Path) -> None:
    generator = get_http_client(make_settings(tmp_path))
    client = next(generator)
    assert isinstance(client, httpx.Client)
    assert client.timeout.read == 2.5
    generator.close()
    assert client.is_closed


def test_external_clients_are_built_from_settings(tmp_path: Path) -> None:
    settings = make_settings(tmp_path)
    with httpx.Client() as http:
        assert isinstance(get_weather_client(http, settings), OpenMeteoClient)
        assert isinstance(get_rates_client(http, settings), NbpClient)
        assert isinstance(get_city_image_client(http, settings), WikipediaClient)


def test_photo_storage_and_today(tmp_path: Path) -> None:
    assert isinstance(get_photo_storage(make_settings(tmp_path)), PhotoStorage)
    assert isinstance(get_today(), date)
