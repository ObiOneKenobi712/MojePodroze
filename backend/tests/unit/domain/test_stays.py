"""Noclegi od–do: liczba nocy, nakładanie się pobytów, wymeldowanie w terminie podróży."""

from datetime import date

import pytest

from app.domain.errors import AccommodationOverlapError, DateOutsideTripError
from app.domain.stays import (
    Stay,
    ensure_check_out_within_trip,
    ensure_no_overlapping_stays,
    nights,
    stay_end,
)


def d(day: int) -> date:
    return date(2026, 9, day)


def test_stay_without_check_out_lasts_one_night() -> None:
    assert stay_end(d(21), None) == d(22)
    assert nights(d(21), None) == 1


@pytest.mark.parametrize(("check_out", "expected"), [(d(22), 1), (d(28), 7)])
def test_nights_count_excludes_check_out_day(check_out: date, expected: int) -> None:
    assert nights(d(21), check_out) == expected


def test_stays_ending_on_check_in_day_do_not_overlap() -> None:
    ensure_no_overlapping_stays(
        Stay(id=None, name="B", check_in=d(28), check_out=d(30)),
        [Stay(id=1, name="A", check_in=d(21), check_out=d(28))],
    )


def test_one_night_stays_on_consecutive_days_do_not_overlap() -> None:
    ensure_no_overlapping_stays(
        Stay(id=None, name="B", check_in=d(22)), [Stay(id=1, name="A", check_in=d(21))]
    )


@pytest.mark.parametrize(
    ("check_in", "check_out"),
    [
        (d(21), None),  # ta sama noc
        (d(27), d(29)),  # ostatnia noc A
        (d(20), d(22)),  # pierwsza noc A
        (d(23), d(24)),  # w środku A
        (d(19), d(30)),  # obejmuje cały pobyt A
    ],
)
def test_overlapping_stays_are_rejected(check_in: date, check_out: date | None) -> None:
    existing = [Stay(id=1, name="Hotel Roma", check_in=d(21), check_out=d(28))]
    with pytest.raises(AccommodationOverlapError) as error:
        ensure_no_overlapping_stays(
            Stay(id=None, name="Nowy", check_in=check_in, check_out=check_out), existing
        )
    assert error.value.code == "ACCOMMODATION_OVERLAP"
    assert "Hotel Roma" in error.value.message


def test_edited_stay_does_not_collide_with_itself() -> None:
    ensure_no_overlapping_stays(
        Stay(id=1, name="A", check_in=d(21), check_out=d(25)),
        [Stay(id=1, name="A", check_in=d(21), check_out=d(28))],
    )


def test_edited_stay_still_collides_with_other_stays() -> None:
    with pytest.raises(AccommodationOverlapError):
        ensure_no_overlapping_stays(
            Stay(id=1, name="A", check_in=d(21), check_out=d(25)),
            [Stay(id=2, name="B", check_in=d(24))],
        )


def test_new_stay_is_not_skipped_when_ids_are_missing() -> None:
    with pytest.raises(AccommodationOverlapError):
        ensure_no_overlapping_stays(
            Stay(id=None, name="A", check_in=d(21)), [Stay(id=None, name="B", check_in=d(21))]
        )


@pytest.mark.parametrize("check_out", [None, d(29), d(30)])
def test_check_out_on_or_before_last_trip_day_is_allowed(check_out: date | None) -> None:
    ensure_check_out_within_trip(check_out, d(30))


def test_check_out_after_trip_end_is_rejected() -> None:
    with pytest.raises(DateOutsideTripError) as error:
        ensure_check_out_within_trip(date(2026, 10, 1), d(30))
    assert error.value.code == "DATE_OUTSIDE_TRIP"
