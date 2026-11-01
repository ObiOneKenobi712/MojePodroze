"""Kalkulator walut, album według dni i etykiety wyliczeń."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

import pytest

from app.domain.album import group_by_day, pick_cover
from app.domain.currency import convert_to_pln
from app.domain.enums import Currency, PlaceKind, Section, TripStatus, TripType

# --- Kalkulator walut -----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("amount", "rate", "expected"),
    [
        (Decimal("100"), Decimal("4.2954"), Decimal("429.54")),
        (Decimal("1"), Decimal("4.2955"), Decimal("4.30")),  # połówka w górę
        (Decimal("1"), Decimal("4.2949"), Decimal("4.29")),
        (Decimal("0"), Decimal("5.1"), Decimal("0.00")),
        (Decimal("12.34"), Decimal("3.9876"), Decimal("49.21")),
    ],
)
def test_convert_to_pln_rounds_to_grosze(amount: Decimal, rate: Decimal, expected: Decimal) -> None:
    assert convert_to_pln(amount, rate) == expected


def test_negative_amount_is_rejected() -> None:
    with pytest.raises(ValueError, match="ujemna"):
        convert_to_pln(Decimal("-0.01"), Decimal("4"))


@pytest.mark.parametrize("rate", [Decimal("0"), Decimal("-4")])
def test_non_positive_rate_is_rejected(rate: Decimal) -> None:
    with pytest.raises(ValueError, match="dodatni"):
        convert_to_pln(Decimal("1"), rate)


# --- Album ----------------------------------------------------------------------------------


@dataclass
class FakePhoto:
    name: str
    day: date


def test_album_groups_photos_by_day_in_ascending_order() -> None:
    photos = [
        FakePhoto("c", date(2027, 5, 3)),
        FakePhoto("a1", date(2027, 5, 1)),
        FakePhoto("a2", date(2027, 5, 1)),
        FakePhoto("b", date(2027, 5, 2)),
    ]
    album = group_by_day(photos, lambda photo: photo.day)
    assert [(day, [p.name for p in items]) for day, items in album] == [
        (date(2027, 5, 1), ["a1", "a2"]),
        (date(2027, 5, 2), ["b"]),
        (date(2027, 5, 3), ["c"]),
    ]


@pytest.mark.parametrize(
    ("cover_photo_id", "photo_ids", "expected"),
    [
        (7, [3, 7, 9], 7),  # wybrana okładka
        (None, [3, 7, 9], 3),  # bez wyboru – pierwsze zdjęcie
        (5, [3, 7, 9], 3),  # wybrane zdjęcie już nie istnieje
        (None, [], None),  # brak zdjęć
        (5, [], None),
    ],
)
def test_pick_cover(cover_photo_id: int | None, photo_ids: list[int], expected: int | None) -> None:
    assert pick_cover(cover_photo_id, photo_ids) == expected


def test_empty_album() -> None:
    assert group_by_day([], lambda photo: photo.day) == []


# --- Etykiety -------------------------------------------------------------------------------


def test_enum_values_are_api_strings_with_polish_labels() -> None:
    assert TripStatus.PLANNED == "planned"
    assert TripStatus("archived") is TripStatus.ARCHIVED
    assert [s.label for s in TripStatus] == ["w planie", "w trakcie", "zrealizowana", "archiwum"]
    assert TripType.FOREIGN.label == "zagraniczna"
    assert Section.PLACES.label == "Noclegi i atrakcje"
    assert PlaceKind.ACCOMMODATION.label == "nocleg"
    assert [c.value for c in Currency] == ["EUR", "USD", "GBP"]
