"""Konfiguracja aplikacji ze zmiennych środowiskowych (prefiks ``MP_``) lub pliku ``.env``."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    """Wszystkie ustawienia w jednym miejscu. Testy tworzą własną instancję z tymczasową bazą."""

    model_config = SettingsConfigDict(env_prefix="MP_", env_file=".env", extra="ignore")

    app_name: str = "Moje podróże API"
    database_url: str = f"sqlite:///{(DATA_DIR / 'moje_podroze.db').as_posix()}"
    upload_dir: Path = DATA_DIR / "uploads"
    max_upload_bytes: int = 10 * 1024 * 1024
    auto_migrate: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    weather_api_url: str = "https://api.open-meteo.com/v1/forecast"
    geocoding_api_url: str = "https://geocoding-api.open-meteo.com/v1/search"
    nbp_api_url: str = "https://api.nbp.pl/api/exchangerates/tables/A/"
    wikipedia_summary_url: str = "https://pl.wikipedia.org/api/rest_v1/page/summary/"
    external_api_timeout_seconds: float = 5.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
