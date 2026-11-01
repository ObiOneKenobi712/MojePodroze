from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import NotFoundError
from app.db.models import PackingItem, Trip, TripCharacter, TripItem, User
from app.domain.enums import Section, TripStatus
from app.domain.status import ensure_editable, ensure_transition_allowed
from app.domain.trip_types import ensure_type_change_allowed, missing_default_packing_items
from app.schemas.trips import TripIn
from app.services.dictionaries import ensure_entry_exists
from app.services.photo_storage import PhotoStorage
from app.services.photos import get_photo

TRIP_NOT_FOUND_MESSAGE = "Nie znaleziono podróży."
UNKNOWN_CHARACTER_MESSAGE = "Wybrany charakter podróży nie istnieje."


def list_trips(db: Session, user: User, status: TripStatus | None = None) -> Sequence[Trip]:
    # Zdjęcia od razu (jedno zapytanie), bo TripOut wylicza z nich okładkę.
    query = select(Trip).where(Trip.owner_id == user.id).options(selectinload(Trip.photos))
    if status is not None:
        query = query.where(Trip.status == status)
    return db.scalars(query.order_by(Trip.start_date, Trip.id)).all()


def get_owned_trip(db: Session, user: User, trip_id: int) -> Trip:
    """Podróż użytkownika. Cudza podróż daje 404 (nie zdradzamy, że istnieje)."""
    trip = db.scalar(select(Trip).where(Trip.id == trip_id, Trip.owner_id == user.id))
    if trip is None:
        raise NotFoundError(TRIP_NOT_FOUND_MESSAGE)
    return trip


def count_items_by_section(db: Session, trip_id: int) -> dict[Section, int]:
    rows = db.execute(
        select(TripItem.item_type, func.count())
        .where(TripItem.trip_id == trip_id)
        .group_by(TripItem.item_type)
    ).all()
    return {Section(item_type): count for item_type, count in rows}


def _add_default_packing_items(trip: Trip) -> None:
    existing = [item.name for item in trip.packing_items]
    for name in missing_default_packing_items(trip.trip_type, existing):
        trip.packing_items.append(PackingItem(name=name, is_default=True))


def create_trip(db: Session, user: User, data: TripIn) -> Trip:
    ensure_entry_exists(db, TripCharacter, data.character_id, UNKNOWN_CHARACTER_MESSAGE)
    trip = Trip(owner_id=user.id, status=TripStatus.PLANNED, **data.model_dump())
    _add_default_packing_items(trip)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def update_trip(db: Session, trip: Trip, data: TripIn) -> Trip:
    ensure_editable(trip.status)
    ensure_entry_exists(db, TripCharacter, data.character_id, UNKNOWN_CHARACTER_MESSAGE)
    if data.trip_type != trip.trip_type:
        ensure_type_change_allowed(data.trip_type, count_items_by_section(db, trip.id))
    for field, value in data.model_dump().items():
        setattr(trip, field, value)
    _add_default_packing_items(trip)
    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip: Trip, storage: PhotoStorage) -> None:
    ensure_editable(trip.status)
    filenames = [photo.stored_filename for photo in trip.photos]
    db.delete(trip)
    db.commit()
    storage.delete_many(filenames)  # pliki usuwamy dopiero po udanym commicie


def change_status(db: Session, trip: Trip, target: TripStatus) -> Trip:
    ensure_transition_allowed(trip.status, target)
    trip.status = target
    db.commit()
    db.refresh(trip)
    return trip


def set_cover(db: Session, trip: Trip, photo_id: int | None) -> Trip:
    """Ustawia okładkę (zdjęcie tej podróży) albo przywraca domyślną (``None``)."""
    ensure_editable(trip.status)
    if photo_id is not None:
        get_photo(db, trip, photo_id)  # zdjęcie innej podróży → 404
    trip.cover_photo_id = photo_id
    db.commit()
    db.refresh(trip)
    return trip
