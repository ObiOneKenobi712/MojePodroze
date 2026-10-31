"""Punkt wejścia aplikacji: ``uvicorn app.main:app --reload`` (uruchamiane z katalogu backend/).

Swagger UI: http://localhost:8000/docs, ReDoc: http://localhost:8000/redoc,
schemat OpenAPI: http://localhost:8000/openapi.json
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.routing import APIRoute

from app.api.router import api_router
from app.config import Settings, get_settings
from app.core.exception_handlers import register_exception_handlers
from app.db.migrations import upgrade_to_head
from app.db.session import build_engine, build_session_factory, ensure_sqlite_directory

API_VERSION = "1.0.0"

API_DESCRIPTION = """
API aplikacji **Moje podróże**: osobisty planer podróży, pamiętnik odwiedzonych miejsc
i organizer w trakcie wyjazdu. Wszystkie koszty są w PLN.

### Jak się zalogować w Swaggerze
1. `POST /api/auth/register` (albo `POST /api/auth/login`) → zapamiętaj `id` z odpowiedzi.
2. Kliknij **Authorize** i wpisz to `id` w pole **X-User-Id**.
3. Od teraz wszystkie zapytania wysyłają nagłówek `X-User-Id`.

> Uproszczenie projektu szkoleniowego uruchamianego tylko lokalnie: hasła są w bazie jawnym
> tekstem, a id użytkownika łatwo podmienić. Nie używaj tego schematu w prawdziwej aplikacji.

### Format błędów
Każdy błąd ma postać `{"detail": "komunikat", "code": "STAŁY_KOD"}`; błędy walidacji
(422 `VALIDATION_ERROR`) mają dodatkowo listę `errors` z polami formularza.
"""

OPENAPI_TAGS = [
    {"name": "System", "description": "Stan aplikacji."},
    {"name": "Konto", "description": "Rejestracja i logowanie (bez tokenów)."},
    {"name": "Użytkownik", "description": "Profil i ustawienia (miasto widżetu pogody)."},
    {"name": "Słowniki", "description": "Listy wyboru do formularzy."},
    {"name": "Ekran główny", "description": "Podróże w grupach statusów i odliczanie."},
    {"name": "Podróże", "description": "CRUD podróży i maszyna stanów statusu."},
    {"name": "Loty", "description": "Tylko podróże zagraniczne."},
    {"name": "Transport", "description": "Przejazdy: samochód, pociąg, autobus, prom…"},
    {"name": "Posiłki", "description": "Co i gdzie; jedna ocena: restauracji."},
    {"name": "Noclegi i atrakcje", "description": "Miejsca z oceną i notatką."},
    {"name": "Wydatki inne", "description": "Kategoria, kwota, opis (bez oceny)."},
    {"name": "Plan dnia", "description": "Plan dzień po dniu z godzinami i miejscami."},
    {"name": "Chcę odwiedzić", "description": "Lista miejsc do odhaczenia."},
    {"name": "Lista pakowania", "description": "Checklista rzeczy do spakowania."},
    {"name": "Pamiętnik", "description": "Wpisy z datą i treścią."},
    {"name": "Zdjęcia i album", "description": "Upload zdjęć i album według dni."},
    {"name": "Kosztorys i oceny", "description": "Sumy, budżet, średnie ocen."},
    {"name": "Rekomendacje", "description": "Podpowiedzi z wcześniejszych podróży."},
    {"name": "Statystyki", "description": "Zestawienia ze zrealizowanych podróży."},
    {"name": "Pogoda", "description": "Open-Meteo (bez klucza API)."},
    {"name": "Kursy walut", "description": "API NBP, tabela A (bez klucza API)."},
    {"name": "Zdjęcie miasta", "description": "Wikipedia (bez klucza API) – zdjęcie celu podróży."},
]


def operation_id(route: APIRoute) -> str:
    """Czytelne operationId (np. ``create_trip``) przydatne przy generowaniu klienta API."""
    return route.name


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = build_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        ensure_sqlite_directory(settings.database_url)
        if settings.auto_migrate:
            upgrade_to_head(settings.database_url)
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        yield
        engine.dispose()

    app = FastAPI(
        title=settings.app_name,
        version=API_VERSION,
        description=API_DESCRIPTION,
        openapi_tags=OPENAPI_TAGS,
        generate_unique_id_function=operation_id,
        swagger_ui_parameters={
            "persistAuthorization": True,
            "displayRequestDuration": True,
            "docExpansion": "none",
            "tryItOutEnabled": True,
        },
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.session_factory = build_session_factory(engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(api_router)

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return app


app = create_app()
