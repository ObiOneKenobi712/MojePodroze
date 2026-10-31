"""Drobne funkcje pomocnicze współdzielone przez moduły domenowe."""

from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.domain.errors import DateOutsideTripError, FlightTooLongError

ZERO = Decimal("0")
CENT = Decimal("0.01")
MAX_FLIGHT_HOURS = 48
MAX_FLIGHT_DURATION = timedelta(hours=MAX_FLIGHT_HOURS)


def round_half_up(value: Decimal) -> Decimal:
    """Zaokrągla do dwóch miejsc po przecinku, połówki w górę (jak w księgowości)."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def normalize_name(value: str) -> str:
    """Klucz do porównywania nazw: bez różnicy wielkości liter i nadmiarowych spacji."""
    return " ".join(value.split()).casefold()


def trip_length_days(start_date: date, end_date: date) -> int:
    """Liczba dni podróży włącznie z dniem wyjazdu i powrotu."""
    if end_date < start_date:
        raise ValueError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.")
    return (end_date - start_date).days + 1


def ensure_date_within_trip(day: date, start_date: date, end_date: date) -> None:
    if not start_date <= day <= end_date:
        raise DateOutsideTripError(
            f"Dzień {day.isoformat()} jest poza terminem podróży "
            f"({start_date.isoformat()} – {end_date.isoformat()})."
        )


def ensure_flight_duration(departure_at: datetime, arrival_at: datetime | None) -> None:
    """Przylot najpóźniej 48 h po wylocie (brak godziny przylotu jest dozwolony)."""
    if arrival_at is not None and arrival_at - departure_at > MAX_FLIGHT_DURATION:
        raise FlightTooLongError(
            f"Przylot może być najpóźniej {MAX_FLIGHT_HOURS} godziny po wylocie."
        )
