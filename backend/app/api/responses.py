"""Opisy odpowiedzi błędów dla dokumentacji OpenAPI (Swagger)."""

from typing import Any

from app.schemas.common import ErrorResponse, ExternalErrorResponse, ValidationErrorResponse

Responses = dict[int | str, dict[str, Any]]

UNAUTHORIZED: Responses = {
    401: {"model": ErrorResponse, "description": "Brak lub nieprawidłowy nagłówek X-User-Id."}
}
NOT_FOUND: Responses = {
    404: {"model": ErrorResponse, "description": "Nie znaleziono (albo zasób innego użytkownika)."}
}
CONFLICT: Responses = {
    409: {
        "model": ErrorResponse,
        "description": "Naruszenie reguły biznesowej, np. TRIP_ARCHIVED, SECTION_NOT_ALLOWED, "
        "INVALID_STATUS_TRANSITION, TRIP_TYPE_CHANGE_BLOCKED, ACCOMMODATION_OVERLAP, LOGIN_TAKEN.",
    }
}
VALIDATION: Responses = {
    422: {
        "model": ValidationErrorResponse,
        "description": "Nieprawidłowe dane (VALIDATION_ERROR, INVALID_REFERENCE, "
        "DATE_OUTSIDE_TRIP, FLIGHT_TOO_LONG, INVALID_UPLOAD).",
    }
}
EXTERNAL: Responses = {
    503: {"model": ExternalErrorResponse, "description": "Zewnętrzne API nie odpowiada."}
}

READ: Responses = {**UNAUTHORIZED, **NOT_FOUND}
WRITE: Responses = {**UNAUTHORIZED, **NOT_FOUND, **CONFLICT, **VALIDATION}
