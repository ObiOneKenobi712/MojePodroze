"""Konfiguracja modeli ORM (bez bazy): relacje muszą dać się zbudować."""

from datetime import date, datetime

from sqlalchemy.orm import configure_mappers

from app.db.models import Photo, Trip


def test_orm_mappers_are_configured() -> None:
    # Np. dwa klucze obce między trips i photos wymagają jawnego foreign_keys w relacji.
    configure_mappers()


def photo(photo_id: int, day: int, uploaded_minute: int = 0) -> Photo:
    return Photo(
        id=photo_id, day=date(2026, 9, day), uploaded_at=datetime(2026, 9, 1, 12, uploaded_minute)
    )


def test_effective_cover_follows_album_order() -> None:
    trip = Trip(photos=[photo(1, 25), photo(2, 22, 5), photo(3, 22, 1)])
    assert trip.effective_cover_photo_id == 3  # najwcześniejszy dzień, potem kolejność dodania


def test_effective_cover_prefers_chosen_photo() -> None:
    trip = Trip(cover_photo_id=1, photos=[photo(1, 25), photo(2, 22)])
    assert trip.effective_cover_photo_id == 1


def test_trip_without_photos_has_no_cover() -> None:
    assert Trip(photos=[]).effective_cover_photo_id is None
