"""Walidacja schematów wejściowych (Pydantic) i pola wyliczane w odpowiedziach."""

from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.exception_handlers import field_name_from_location
from app.domain.enums import PlaceKind, Section, TripStatus, TripType
from app.schemas.dictionaries import DictionaryEntryOut
from app.schemas.items import FlightIn, MealIn, PlaceIn, PlaceOut
from app.schemas.photos import PhotoOut, PhotoPatch
from app.schemas.planning import PackingItemPatch, WishlistItemPatch
from app.schemas.trips import TripIn, TripOut
from app.schemas.users import CredentialsIn

VALID_TRIP: dict[str, Any] = {
    "name": "  Majówka  ",
    "destination_city": "Rzym",
    "destination_country": "Włochy",
    "start_date": "2027-05-01",
    "end_date": "2027-05-05",
    "trip_type": "foreign",
    "character_id": 3,
    "planned_budget": "4500.50",
}


def error_fields(error: ValidationError) -> set[str]:
    return {".".join(str(part) for part in item["loc"]) for item in error.errors()}


def test_valid_trip_is_parsed_and_trimmed() -> None:
    trip = TripIn.model_validate(VALID_TRIP)
    assert trip.name == "Majówka"
    assert trip.trip_type is TripType.FOREIGN
    assert trip.planned_budget == Decimal("4500.50")


def test_one_day_trip_is_valid() -> None:
    TripIn.model_validate({**VALID_TRIP, "end_date": "2027-05-01"})


def test_trip_end_before_start_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Data zakończenia"):
        TripIn.model_validate({**VALID_TRIP, "end_date": "2027-04-30"})


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", "   "),
        ("name", "x" * 121),
        ("planned_budget", 0),
        ("planned_budget", "-1"),
        ("planned_budget", "10.001"),
        ("character_id", 0),
        ("trip_type", "space"),
    ],
)
def test_invalid_trip_fields(field: str, value: Any) -> None:
    with pytest.raises(ValidationError) as error:
        TripIn.model_validate({**VALID_TRIP, field: value})
    assert field in error_fields(error.value)


def test_budget_is_optional() -> None:
    assert TripIn.model_validate({**VALID_TRIP, "planned_budget": None}).planned_budget is None


def test_flight_number_is_normalized_to_upper_case() -> None:
    flight = FlightIn.model_validate(
        {
            "flight_number": " lo327 ",
            "departure_airport": "WAW",
            "arrival_airport": "FCO",
            "departure_at": "2027-05-01T06:00:00",
            "cost": 700,
        }
    )
    assert flight.flight_number == "LO327"
    assert flight.rating is None


def test_flight_arrival_before_departure_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Przylot"):
        FlightIn.model_validate(
            {
                "flight_number": "LO1",
                "departure_airport": "WAW",
                "arrival_airport": "FCO",
                "departure_at": "2027-05-01T10:00:00",
                "arrival_at": "2027-05-01T09:59:00",
                "cost": 1,
            }
        )


def test_flight_with_timezone_is_rejected() -> None:
    with pytest.raises(ValidationError):
        FlightIn.model_validate(
            {
                "flight_number": "LO1",
                "departure_airport": "WAW",
                "arrival_airport": "FCO",
                "departure_at": "2027-05-01T10:00:00+02:00",
                "cost": 1,
            }
        )


@pytest.mark.parametrize("rating", [0, 6])
def test_rating_out_of_scale_is_rejected(rating: int) -> None:
    with pytest.raises(ValidationError):
        MealIn.model_validate(
            {
                "dish": "Pizza",
                "restaurant_name": "Da Mario",
                "meal_date": "2027-05-02",
                "cost": 50,
                "rating": rating,
            }
        )


@pytest.mark.parametrize("schema", [WishlistItemPatch, PackingItemPatch])
def test_patch_rejects_explicit_null_name(schema: type) -> None:
    with pytest.raises(ValidationError, match="null"):
        schema.model_validate({"name": None})


def test_patch_allows_omitting_fields() -> None:
    patch = WishlistItemPatch.model_validate({"visited": True})
    assert patch.model_dump(exclude_unset=True) == {"visited": True}


def test_patch_allows_clearing_optional_note() -> None:
    assert WishlistItemPatch.model_validate({"note": None}).model_dump(exclude_unset=True) == {
        "note": None
    }


def test_photo_patch_rejects_null_day() -> None:
    with pytest.raises(ValidationError):
        PhotoPatch.model_validate({"day": None})


@pytest.mark.parametrize("login", ["ab", "ma spacje", "x" * 51, "zły!"])
def test_invalid_login_is_rejected(login: str) -> None:
    with pytest.raises(ValidationError):
        CredentialsIn.model_validate({"login": login, "password": "haslo123"})


def place_data(**changes: Any) -> dict[str, Any]:
    return {
        "name": "Hotel Roma",
        "kind": "accommodation",
        "visit_date": "2026-09-21",
        "cost": 900,
        **changes,
    }


def test_accommodation_with_check_out_is_valid() -> None:
    place = PlaceIn.model_validate(place_data(check_out_date="2026-09-28"))
    assert place.check_out_date == date(2026, 9, 28)


def test_check_out_is_optional() -> None:
    assert PlaceIn.model_validate(place_data()).check_out_date is None


@pytest.mark.parametrize("check_out", ["2026-09-21", "2026-09-20"])
def test_check_out_not_after_check_in_is_rejected(check_out: str) -> None:
    with pytest.raises(ValidationError, match="Wymeldowanie"):
        PlaceIn.model_validate(place_data(check_out_date=check_out))


def test_attraction_cannot_have_check_out() -> None:
    with pytest.raises(ValidationError, match="tylko dla noclegu"):
        PlaceIn.model_validate(place_data(kind="attraction", check_out_date="2026-09-22"))


def place_out(kind: PlaceKind, check_out: date | None) -> PlaceOut:
    return PlaceOut(
        id=1,
        trip_id=1,
        cost=Decimal("900"),
        created_at=datetime(2026, 9, 1),
        rating=None,
        name="Hotel Roma",
        kind=kind,
        visit_date=date(2026, 9, 21),
        check_out_date=check_out,
        note=None,
    )


@pytest.mark.parametrize(("check_out", "nights"), [(None, 1), (date(2026, 9, 28), 7)])
def test_place_out_counts_nights_of_accommodation(check_out: date | None, nights: int) -> None:
    assert place_out(PlaceKind.ACCOMMODATION, check_out).model_dump()["nights"] == nights


def test_place_out_has_no_nights_for_attraction() -> None:
    assert place_out(PlaceKind.ATTRACTION, None).model_dump()["nights"] is None


def test_trip_out_computed_fields() -> None:
    trip = SimpleNamespace(
        id=1,
        name="Rzym",
        destination_city="Rzym",
        destination_country="Włochy",
        start_date=date(2027, 5, 1),
        end_date=date(2027, 5, 5),
        trip_type=TripType.DOMESTIC,
        character=SimpleNamespace(id=3, code="city", name="Miasto"),
        status=TripStatus.COMPLETED,
        planned_budget=Decimal("100.10"),
        created_at=datetime(2027, 1, 1),
        updated_at=datetime(2027, 1, 1),
    )
    data = TripOut.model_validate(trip).model_dump(mode="json")
    assert data["status_label"] == "zrealizowana"
    assert data["trip_type_label"] == "krajowa"
    assert data["duration_days"] == 5
    assert data["allowed_transitions"] == ["in_progress", "archived"]
    assert data["is_read_only"] is False
    assert Section.FLIGHTS.value not in data["available_sections"]
    assert data["planned_budget"] == 100.1  # liczba JSON, nie tekst
    assert data["cover_photo_id"] is None
    assert data["cover_photo_url"] is None
    assert "effective_cover_photo_id" not in data


def test_trip_out_cover_url_points_to_effective_cover() -> None:
    data = TripOut(
        **{**VALID_TRIP, "planned_budget": None},
        id=4,
        character=DictionaryEntryOut(id=3, code="city", name="Miasto"),
        status=TripStatus.PLANNED,
        cover_photo_id=None,
        effective_cover_photo_id=9,
        created_at=datetime(2027, 1, 1),
        updated_at=datetime(2027, 1, 1),
    ).model_dump()
    assert data["cover_photo_id"] is None
    assert data["cover_photo_url"] == "/api/trips/4/photos/9/file"


def test_photo_out_has_file_url() -> None:
    photo = PhotoOut(
        id=9,
        trip_id=4,
        original_filename="a.png",
        content_type="image/png",
        size_bytes=10,
        day=date(2027, 5, 1),
        caption=None,
        uploaded_at=datetime(2027, 5, 1),
    )
    assert photo.model_dump()["file_url"] == "/api/trips/4/photos/9/file"


@pytest.mark.parametrize(
    ("location", "field"),
    [
        (("body", "end_date"), "end_date"),
        (("body", "items", 0, "name"), "items.0.name"),
        (("query", "status"), "status"),
        (("body",), "body"),
        ((), ""),
    ],
)
def test_validation_errorfield_name_from_location(location: tuple[Any, ...], field: str) -> None:
    assert field_name_from_location(location) == field
