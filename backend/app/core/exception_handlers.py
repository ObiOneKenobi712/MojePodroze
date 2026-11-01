"""Jednolity format błędów API: ``{"detail": "...", "code": "..."}``.

Frontend i testy E2E opierają się na stałym polu ``code``, a ``detail`` pokazują użytkownikowi.
"""

from collections.abc import Mapping

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import AppError
from app.domain.errors import DateOutsideTripError, DomainError, FlightTooLongError
from app.integrations.errors import ExternalServiceError

DOMAIN_ERROR_STATUS: Mapping[type[DomainError], int] = {
    DateOutsideTripError: 422,
    FlightTooLongError: 422,
}
DEFAULT_DOMAIN_STATUS = 409
VALIDATION_MESSAGE = "Nieprawidłowe dane wejściowe."
_LOCATION_PREFIXES = {"body", "query", "path", "header", "cookie"}


def _error(status_code: int, detail: str, code: str, **extra: object) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail, "code": code, **extra})


def field_name_from_location(location: tuple[object, ...]) -> str:
    parts = [str(part) for part in location]
    if len(parts) > 1 and parts[0] in _LOCATION_PREFIXES:
        parts = parts[1:]
    return ".".join(parts)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return _error(exc.status_code, exc.message, exc.code)


async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
    status_code = DOMAIN_ERROR_STATUS.get(type(exc), DEFAULT_DOMAIN_STATUS)
    return _error(status_code, exc.message, exc.code)


async def external_service_error_handler(
    _request: Request, exc: ExternalServiceError
) -> JSONResponse:
    return _error(503, exc.message, "EXTERNAL_API_UNAVAILABLE", service=exc.service)


async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": field_name_from_location(tuple(error.get("loc", ()))),
            "message": str(error.get("msg", "")),
            "type": str(error.get("type", "")),
        }
        for error in exc.errors()
    ]
    return _error(422, VALIDATION_MESSAGE, "VALIDATION_ERROR", errors=errors)


async def http_error_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    response = _error(exc.status_code, str(exc.detail), f"HTTP_{exc.status_code}")
    if exc.headers:
        response.headers.update(exc.headers)
    return response


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(ExternalServiceError, external_service_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
