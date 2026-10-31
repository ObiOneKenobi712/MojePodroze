"""Funkcje pomocnicze domeny i średnie ocen."""

from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest

from app.domain.common import (
    MAX_FLIGHT_DURATION,
    ensure_date_within_trip,
    ensure_flight_duration,
    normalize_name,
    round_half_up,
    trip_length_days,
)
from app.domain.errors import DateOutsideTripError, FlightTooLongError
from app.domain.ratings import average_rating


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (Decimal("1.005"), Decimal("1.01")),
        (Decimal("1.004"), Decimal("1.00")),
        (Decimal("2.675"), Decimal("2.68")),
        (Decimal("-1.005"), Decimal("-1.01")),
        (Decimal("7"), Decimal("7.00")),
    ],
)
def test_round_half_up(value: Decimal, expected: Decimal) -> None:
    assert round_half_up(value) == expected
    assert round_half_up(value).as_tuple().exponent == -2


@pytest.mark.parametrize(
    ("raw", "normalized"),
    [
        ("Kraków", "kraków"),
        ("  KRAKÓW  ", "kraków"),
        ("Nowy   Targ", "nowy targ"),
        ("Straße", "strasse"),
    ],
)
def test_normalize_name(raw: str, normalized: str) -> None:
    assert normalize_name(raw) == normalized


@pytest.mark.parametrize(
    ("start", "end", "days"),
    [
        (date(2027, 5, 1), date(2027, 5, 1), 1),
        (date(2027, 5, 1), date(2027, 5, 5), 5),
        (date(2027, 2, 27), date(2027, 3, 1), 3),
        (date(2028, 2, 28), date(2028, 3, 1), 3),  # rok przestępny
    ],
)
def test_trip_length_counts_both_ends(start: date, end: date, days: int) -> None:
    assert trip_length_days(start, end) == days


def test_trip_length_rejects_reversed_dates() -> None:
    with pytest.raises(ValueError, match="wcześniejsza"):
        trip_length_days(date(2027, 5, 2), date(2027, 5, 1))


@pytest.mark.parametrize("day", [date(2027, 5, 1), date(2027, 5, 3), date(2027, 5, 5)])
def test_date_within_trip_including_boundaries(day: date) -> None:
    ensure_date_within_trip(day, date(2027, 5, 1), date(2027, 5, 5))


@pytest.mark.parametrize("day", [date(2027, 4, 30), date(2027, 5, 6)])
def test_date_outside_trip_is_rejected(day: date) -> None:
    with pytest.raises(DateOutsideTripError) as error:
        ensure_date_within_trip(day, date(2027, 5, 1), date(2027, 5, 5))
    assert error.value.code == "DATE_OUTSIDE_TRIP"
    assert day.isoformat() in error.value.message


DEPARTURE = datetime(2027, 5, 1, 10, 0)


@pytest.mark.parametrize(
    "arrival_at",
    [None, DEPARTURE, DEPARTURE + timedelta(hours=3), DEPARTURE + MAX_FLIGHT_DURATION],
)
def test_flight_up_to_48_hours_is_allowed(arrival_at: datetime | None) -> None:
    ensure_flight_duration(DEPARTURE, arrival_at)


def test_flight_longer_than_48_hours_is_rejected() -> None:
    arrival_at = DEPARTURE + MAX_FLIGHT_DURATION + timedelta(minutes=1)
    with pytest.raises(FlightTooLongError) as error:
        ensure_flight_duration(DEPARTURE, arrival_at)
    assert error.value.code == "FLIGHT_TOO_LONG"
    assert "48" in error.value.message


def test_average_rating_is_plain_mean() -> None:
    assert average_rating([5, 4, 3]) == Decimal("4.00")


def test_average_rating_rounds_to_two_places() -> None:
    assert average_rating([5, 4, 4]) == Decimal("4.33")
    assert average_rating([5, 5, 4]) == Decimal("4.67")


def test_average_rating_skips_missing_ratings() -> None:
    assert average_rating([None, 2, None, 4]) == Decimal("3.00")


def test_average_rating_of_nothing_is_none() -> None:
    assert average_rating([]) is None
    assert average_rating([None, None]) is None


def test_average_rating_accepts_generator() -> None:
    assert average_rating(rating for rating in (1, 2)) == Decimal("1.50")
