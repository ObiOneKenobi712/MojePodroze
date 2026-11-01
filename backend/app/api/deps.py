"""Zależności FastAPI (Dependency Injection).

Testy podmieniają je przez ``app.dependency_overrides``.
"""

from collections.abc import Iterator
from datetime import date
from typing import Annotated

import httpx
from fastapi import Depends, Path, Request, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.config import Settings
from app.core.errors import AuthenticationRequiredError, InvalidUserError
from app.db.models import Trip, User
from app.integrations.nbp import NbpClient
from app.integrations.open_meteo import OpenMeteoClient
from app.integrations.wikipedia import WikipediaClient
from app.services.photo_storage import PhotoStorage
from app.services.trips import get_owned_trip

USER_ID_HEADER = "X-User-Id"

user_id_header = APIKeyHeader(
    name=USER_ID_HEADER,
    scheme_name="UserIdHeader",
    description="Id użytkownika zwrócone przez POST /api/auth/login.",
    auto_error=False,
)


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    session: Session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


AppSettings = Annotated[Settings, Depends(get_app_settings)]
DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession, raw_user_id: Annotated[str | None, Security(user_id_header)]
) -> User:
    """Czyta nagłówek ``X-User-Id``. Brak → 401 AUTH_REQUIRED, nieznane id → 401 INVALID_USER."""
    if raw_user_id is None or not raw_user_id.strip():
        raise AuthenticationRequiredError(f"Brak nagłówka {USER_ID_HEADER}. Zaloguj się.")
    try:
        user_id = int(raw_user_id)
    except ValueError as exc:
        raise InvalidUserError("Nieprawidłowy identyfikator użytkownika.") from exc
    user = db.get(User, user_id)
    if user is None:
        raise InvalidUserError("Nieznany użytkownik. Zaloguj się ponownie.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_trip(
    trip_id: Annotated[int, Path(ge=1, description="Id podróży.")],
    user: CurrentUser,
    db: DbSession,
) -> Trip:
    return get_owned_trip(db, user, trip_id)


OwnedTrip = Annotated[Trip, Depends(get_trip)]


def get_today() -> date:
    """Dzisiejsza data; w testach podmieniana na stałą („zamrożona” data)."""
    return date.today()


Today = Annotated[date, Depends(get_today)]


def get_photo_storage(settings: AppSettings) -> PhotoStorage:
    return PhotoStorage(settings.upload_dir, settings.max_upload_bytes)


Storage = Annotated[PhotoStorage, Depends(get_photo_storage)]


def get_http_client(settings: AppSettings) -> Iterator[httpx.Client]:
    with httpx.Client(timeout=settings.external_api_timeout_seconds) as client:
        yield client


HttpClient = Annotated[httpx.Client, Depends(get_http_client)]


def get_weather_client(http: HttpClient, settings: AppSettings) -> OpenMeteoClient:
    return OpenMeteoClient(http, settings.weather_api_url, settings.geocoding_api_url)


def get_rates_client(http: HttpClient, settings: AppSettings) -> NbpClient:
    return NbpClient(http, settings.nbp_api_url)


def get_city_image_client(http: HttpClient, settings: AppSettings) -> WikipediaClient:
    return WikipediaClient(http, settings.wikipedia_summary_url)


WeatherClient = Annotated[OpenMeteoClient, Depends(get_weather_client)]
RatesClient = Annotated[NbpClient, Depends(get_rates_client)]
CityImageClient = Annotated[WikipediaClient, Depends(get_city_image_client)]
