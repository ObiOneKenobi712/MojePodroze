"""Zdjęcie miasta z Wikipedii: parsowanie podsumowania i klient HTTP (bez sieci)."""

from typing import Any

import httpx
import pytest

from app.integrations.errors import ExternalServiceError
from app.integrations.wikipedia import (
    USER_AGENT,
    CityImage,
    WikipediaClient,
    page_title,
    parse_summary,
)

IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/rzym.jpg/320px-rzym.jpg"
ARTICLE = "https://pl.wikipedia.org/wiki/Rzym"
SUMMARY: dict[str, Any] = {
    "type": "standard",
    "title": "Rzym",
    "thumbnail": {"source": IMAGE, "width": 320, "height": 213},
    "content_urls": {"desktop": {"page": ARTICLE}},
}
SUMMARY_URL = "https://wiki.test/summary/"


def test_parse_summary_returns_thumbnail_and_article() -> None:
    assert parse_summary(SUMMARY) == CityImage(image_url=IMAGE, source_url=ARTICLE)


@pytest.mark.parametrize(
    "payload",
    [
        {**SUMMARY, "type": "disambiguation"},
        {key: value for key, value in SUMMARY.items() if key != "thumbnail"},
        {**SUMMARY, "thumbnail": {}},
        {**SUMMARY, "content_urls": {}},
        {},
    ],
)
def test_parse_summary_without_usable_image_returns_none(payload: dict[str, Any]) -> None:
    assert parse_summary(payload) is None


@pytest.mark.parametrize("payload", [None, [], "tekst", {"thumbnail": "zły"}])
def test_parse_summary_rejects_invalid_payload(payload: Any) -> None:
    with pytest.raises(ExternalServiceError) as error:
        parse_summary(payload)
    assert error.value.service == "Wikipedia"


@pytest.mark.parametrize(
    ("city", "title"),
    [("Rzym", "Rzym"), (" Nowy  Sącz ", "Nowy_S%C4%85cz"), ("Ateny/Pireus", "Ateny%2FPireus")],
)
def test_page_title_is_url_safe(city: str, title: str) -> None:
    assert page_title(city) == title


def client_for(handler: Any) -> WikipediaClient:
    return WikipediaClient(httpx.Client(transport=httpx.MockTransport(handler)), SUMMARY_URL)


def test_client_requests_article_with_user_agent() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=SUMMARY)

    assert client_for(handler).city_image("Nowy Sącz") == CityImage(IMAGE, ARTICLE)
    assert str(requests[0].url) == SUMMARY_URL + "Nowy_S%C4%85cz"
    assert requests[0].headers["User-Agent"] == USER_AGENT


def test_client_follows_redirect_to_normalized_title() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/rzym"):
            return httpx.Response(302, headers={"Location": SUMMARY_URL + "Rzym"})
        return httpx.Response(200, json=SUMMARY)

    assert client_for(handler).city_image("rzym") == CityImage(IMAGE, ARTICLE)


def test_missing_article_returns_none() -> None:
    assert client_for(lambda _request: httpx.Response(404)).city_image("Xyz") is None


@pytest.mark.parametrize("status_code", [429, 500, 503])
def test_client_wraps_http_errors(status_code: int) -> None:
    with pytest.raises(ExternalServiceError) as error:
        client_for(lambda _request: httpx.Response(status_code)).city_image("Rzym")
    assert "niedostępna" in error.value.message


def test_client_wraps_invalid_json_and_timeout() -> None:
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timeout", request=request)

    with pytest.raises(ExternalServiceError):
        client_for(lambda _request: httpx.Response(200, text="<html>")).city_image("Rzym")
    with pytest.raises(ExternalServiceError):
        client_for(timeout).city_image("Rzym")
