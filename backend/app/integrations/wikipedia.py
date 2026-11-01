"""Klient Wikipedii (REST API, bez klucza): zdjęcie miasta z polskiego artykułu.

Używamy miniatury z podsumowania artykułu (``/page/summary/{tytuł}``). Wikimedia wymaga
nagłówka ``User-Agent`` z nazwą aplikacji i adresem kontaktowym. Parsowanie jest w czystej
funkcji, żeby testować je bez sieci.
"""

from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.integrations.errors import ExternalServiceError

SERVICE_NAME = "Wikipedia"
# Wikimedia odrzuca (403) zapytania bez adresu kontaktowego w User-Agent.
USER_AGENT = "MojePodroze/1.0 (https://github.com/TestAutomationEngneer/MojePodroze)"
UNAVAILABLE_MESSAGE = "Wikipedia jest chwilowo niedostępna."
INVALID_RESPONSE_MESSAGE = "Wikipedia zwróciła nieprawidłowe dane."
DISAMBIGUATION = "disambiguation"


@dataclass(frozen=True)
class CityImage:
    image_url: str
    source_url: str


def page_title(city: str) -> str:
    """Tytuł artykułu w adresie: spacje → podkreślenia, reszta zakodowana (np. „Nowy Sącz”)."""
    return quote("_".join(city.split()), safe="")


def parse_summary(payload: Any) -> CityImage | None:
    """Miniatura i adres artykułu; ``None`` dla strony ujednoznaczniającej albo bez zdjęcia."""
    try:
        if payload.get("type") == DISAMBIGUATION:
            return None
        image_url = (payload.get("thumbnail") or {}).get("source")
        source_url = ((payload.get("content_urls") or {}).get("desktop") or {}).get("page")
    except AttributeError as exc:
        raise ExternalServiceError(SERVICE_NAME, INVALID_RESPONSE_MESSAGE) from exc
    if not image_url or not source_url:
        return None
    return CityImage(image_url=str(image_url), source_url=str(source_url))


class WikipediaClient:
    def __init__(self, http: httpx.Client, summary_url: str) -> None:
        self._http = http
        self._summary_url = summary_url

    def city_image(self, city: str) -> CityImage | None:
        """Zdjęcie miasta albo ``None``, gdy nie ma artykułu lub zdjęcia."""
        try:
            response = self._http.get(
                self._summary_url + page_title(city),
                headers={"User-Agent": USER_AGENT},
                follow_redirects=True,
            )
            if response.status_code == httpx.codes.NOT_FOUND:
                return None
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ExternalServiceError(SERVICE_NAME, UNAVAILABLE_MESSAGE) from exc
        return parse_summary(payload)
