"""Modele ORM (tabele bazy danych).

Pozycje kosztowe (loty, transport, posiłki, noclegi i atrakcje, wydatki inne) używają
dziedziczenia tabel złączonych (joined table inheritance): wspólna tabela ``trip_items``
(koszt, ocena) + osobna tabela na pola specyficzne dla sekcji. Dzięki temu suma kosztów
to jedno zapytanie ``SUM(trip_items.cost)``, a każda klasa ORM umie zamienić się na
obiekt domenowy metodą ``to_domain()``.
"""

from datetime import UTC, date, datetime, time
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import Money
from app.domain import items as domain_items
from app.domain.album import pick_cover
from app.domain.enums import PlaceKind, Section, TripStatus, TripType
from app.domain.trips import TripSnapshot

DEFAULT_WEATHER_CITY = "Warszawa"
DEFAULT_WEATHER_COUNTRY = "Polska"
DEFAULT_WEATHER_LATITUDE = 52.22977
DEFAULT_WEATHER_LONGITUDE = 21.01178


def utc_now() -> datetime:
    """Bieżący czas UTC bez strefy (SQLite nie przechowuje stref czasowych)."""
    return datetime.now(UTC).replace(tzinfo=None)


def enum_column(enum_cls: type[PyEnum], name: str) -> Enum:
    """Enum zapisywany jako VARCHAR z wartością (np. ``planned``), a nie nazwą członka."""
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        length=20,
        values_callable=lambda members: [member.value for member in members],
        validate_strings=True,
    )


# --- Użytkownicy ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(50), unique=True)
    # Świadome uproszczenie projektu szkoleniowego: hasło jawnym tekstem (patrz README).
    password: Mapped[str] = mapped_column(String(128))
    weather_city_name: Mapped[str] = mapped_column(String(100), default=DEFAULT_WEATHER_CITY)
    weather_country: Mapped[str | None] = mapped_column(
        String(100), default=DEFAULT_WEATHER_COUNTRY
    )
    weather_latitude: Mapped[float] = mapped_column(default=DEFAULT_WEATHER_LATITUDE)
    weather_longitude: Mapped[float] = mapped_column(default=DEFAULT_WEATHER_LONGITUDE)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    trips: Mapped[list["Trip"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


# --- Słowniki ------------------------------------------------------------------------------


class DictionaryMixin:
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name: Mapped[str] = mapped_column(String(60))
    sort_order: Mapped[int] = mapped_column(default=0)


class TripCharacter(DictionaryMixin, Base):
    """Charakter podróży: góry, morze, miasto, jeziora…"""

    __tablename__ = "trip_characters"


class TransportMean(DictionaryMixin, Base):
    """Środek transportu: samochód, pociąg, autobus, prom, taksówka…"""

    __tablename__ = "transport_means"


class ExpenseCategory(DictionaryMixin, Base):
    """Kategoria wydatku innego: pamiątki, bilety wstępu, ubezpieczenie…"""

    __tablename__ = "expense_categories"


# --- Podróże -------------------------------------------------------------------------------


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="dates_order"),
        CheckConstraint("planned_budget IS NULL OR planned_budget > 0", name="budget_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    destination_city: Mapped[str] = mapped_column(String(100))
    destination_country: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date]
    end_date: Mapped[date]
    trip_type: Mapped[TripType] = mapped_column(enum_column(TripType, "trip_type"))
    character_id: Mapped[int] = mapped_column(ForeignKey("trip_characters.id", ondelete="RESTRICT"))
    status: Mapped[TripStatus] = mapped_column(
        enum_column(TripStatus, "trip_status"), default=TripStatus.PLANNED
    )
    planned_budget: Mapped[Decimal | None] = mapped_column(Money)
    # Wybrana okładka. Bez relationship: photos → trips i trips → photos tworzą cykl, a do
    # odczytu wystarczy id. Usunięcie zdjęcia czyści pole w bazie (ON DELETE SET NULL).
    cover_photo_id: Mapped[int | None] = mapped_column(
        ForeignKey("photos.id", ondelete="SET NULL", use_alter=True)
    )
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    owner: Mapped[User] = relationship(back_populates="trips")
    character: Mapped[TripCharacter] = relationship(lazy="joined")
    items: Mapped[list["TripItem"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="TripItem.id"
    )
    plan_points: Mapped[list["DayPlanPoint"]] = relationship(
        cascade="all, delete-orphan", order_by="DayPlanPoint.id"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(
        cascade="all, delete-orphan", order_by="WishlistItem.id"
    )
    packing_items: Mapped[list["PackingItem"]] = relationship(
        cascade="all, delete-orphan", order_by="PackingItem.id"
    )
    diary_entries: Mapped[list["DiaryEntry"]] = relationship(
        cascade="all, delete-orphan", order_by="DiaryEntry.id"
    )
    photos: Mapped[list["Photo"]] = relationship(
        cascade="all, delete-orphan",
        order_by="Photo.id",
        foreign_keys="Photo.trip_id",  # trips.cover_photo_id to drugi klucz między tabelami
    )

    @property
    def effective_cover_photo_id(self) -> int | None:
        """Okładka do pokazania: wybrana albo pierwsze zdjęcie w kolejności albumu."""
        ordered = sorted(self.photos, key=lambda photo: (photo.day, photo.uploaded_at, photo.id))
        return pick_cover(self.cover_photo_id, [photo.id for photo in ordered])

    def to_snapshot(self) -> TripSnapshot:
        return TripSnapshot(
            id=self.id,
            name=self.name,
            destination_city=self.destination_city,
            start_date=self.start_date,
            end_date=self.end_date,
            status=self.status,
            trip_type=self.trip_type,
            character=self.character.name,
        )

    def domain_items(self) -> list[domain_items.TripItem]:
        return [item.to_domain() for item in self.items]


# --- Pozycje kosztowe (polimorficzne) ------------------------------------------------------


class TripItem(Base):
    """Wspólna część każdej pozycji: koszt w PLN i ocena 1–5."""

    __tablename__ = "trip_items"
    __table_args__ = (
        CheckConstraint("cost >= 0", name="cost_non_negative"),
        CheckConstraint("rating IS NULL OR (rating BETWEEN 1 AND 5)", name="rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    item_type: Mapped[str] = mapped_column(String(20))
    cost: Mapped[Decimal] = mapped_column(Money)
    rating: Mapped[int | None]
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    trip: Mapped[Trip] = relationship(back_populates="items")

    __mapper_args__ = {  # noqa: RUF012 - konfiguracja SQLAlchemy
        "polymorphic_on": "item_type",
        "polymorphic_abstract": True,
        "with_polymorphic": "*",
    }

    def to_domain(self) -> domain_items.TripItem:
        raise NotImplementedError  # pragma: no cover - implementują klasy pochodne


class Flight(TripItem):
    __tablename__ = "flights"
    __mapper_args__ = {"polymorphic_identity": Section.FLIGHTS.value}  # noqa: RUF012

    id: Mapped[int] = mapped_column(
        ForeignKey("trip_items.id", ondelete="CASCADE"), primary_key=True
    )
    flight_number: Mapped[str] = mapped_column(String(10))
    departure_airport: Mapped[str] = mapped_column(String(100))
    arrival_airport: Mapped[str] = mapped_column(String(100))
    departure_at: Mapped[datetime]
    arrival_at: Mapped[datetime | None]

    def to_domain(self) -> domain_items.TripItem:
        return domain_items.Flight(
            cost=self.cost, rating=self.rating, flight_number=self.flight_number
        )


class Transport(TripItem):
    __tablename__ = "transports"
    __mapper_args__ = {"polymorphic_identity": Section.TRANSPORT.value}  # noqa: RUF012

    id: Mapped[int] = mapped_column(
        ForeignKey("trip_items.id", ondelete="CASCADE"), primary_key=True
    )
    transport_mean_id: Mapped[int] = mapped_column(
        ForeignKey("transport_means.id", ondelete="RESTRICT")
    )
    route_from: Mapped[str] = mapped_column(String(100))
    route_to: Mapped[str] = mapped_column(String(100))
    travel_date: Mapped[date]

    transport_mean: Mapped[TransportMean] = relationship(lazy="joined")

    def to_domain(self) -> domain_items.TripItem:
        return domain_items.Transport(
            cost=self.cost,
            rating=self.rating,
            means=self.transport_mean.name,
            route=f"{self.route_from} → {self.route_to}",
        )


class Meal(TripItem):
    __tablename__ = "meals"
    __mapper_args__ = {"polymorphic_identity": Section.MEALS.value}  # noqa: RUF012

    id: Mapped[int] = mapped_column(
        ForeignKey("trip_items.id", ondelete="CASCADE"), primary_key=True
    )
    dish: Mapped[str] = mapped_column(String(200))
    restaurant_name: Mapped[str] = mapped_column(String(150))
    meal_date: Mapped[date]

    def to_domain(self) -> domain_items.TripItem:
        return domain_items.Meal(
            cost=self.cost,
            rating=self.rating,
            restaurant_name=self.restaurant_name,
            dish=self.dish,
        )


class Place(TripItem):
    """Nocleg albo atrakcja."""

    __tablename__ = "places"
    __table_args__ = (
        CheckConstraint(
            "check_out_date IS NULL OR check_out_date > visit_date", name="check_out_after_visit"
        ),
    )
    __mapper_args__ = {"polymorphic_identity": Section.PLACES.value}  # noqa: RUF012

    id: Mapped[int] = mapped_column(
        ForeignKey("trip_items.id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(150))
    kind: Mapped[PlaceKind] = mapped_column(enum_column(PlaceKind, "place_kind"))
    visit_date: Mapped[date]
    check_out_date: Mapped[date | None]
    note: Mapped[str | None] = mapped_column(Text)

    def to_domain(self) -> domain_items.TripItem:
        return domain_items.Place(
            cost=self.cost, rating=self.rating, name=self.name, kind=self.kind
        )


class Expense(TripItem):
    """Wydatek inny: kategoria, kwota (``cost``), opis. Bez oceny."""

    __tablename__ = "expenses"
    __mapper_args__ = {"polymorphic_identity": Section.EXPENSES.value}  # noqa: RUF012

    id: Mapped[int] = mapped_column(
        ForeignKey("trip_items.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("expense_categories.id", ondelete="RESTRICT")
    )
    description: Mapped[str] = mapped_column(String(255))
    expense_date: Mapped[date | None]

    category: Mapped[ExpenseCategory] = relationship(lazy="joined")

    def to_domain(self) -> domain_items.TripItem:
        return domain_items.Expense(
            cost=self.cost, category=self.category.name, description=self.description
        )


# --- Plan, listy, pamiętnik, zdjęcia -------------------------------------------------------


class DayPlanPoint(Base):
    """Punkt planu dnia: dzień, opcjonalna godzina i miejsce."""

    __tablename__ = "plan_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    day: Mapped[date]
    planned_time: Mapped[time | None]
    place: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)


class WishlistItem(Base):
    """Punkt z listy „chcę odwiedzić”."""

    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    note: Mapped[str | None] = mapped_column(Text)
    visited: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)


class PackingItem(Base):
    __tablename__ = "packing_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    packed: Mapped[bool] = mapped_column(default=False)
    is_default: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date]
    title: Mapped[str | None] = mapped_column(String(150))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)


class Photo(Base):
    """Metadane zdjęcia. Sam plik leży na dysku w ``MP_UPLOAD_DIR/<stored_filename>``."""

    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_filename: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str] = mapped_column(String(50))
    size_bytes: Mapped[int]
    day: Mapped[date]
    caption: Mapped[str | None] = mapped_column(String(255))
    uploaded_at: Mapped[datetime] = mapped_column(default=utc_now)
