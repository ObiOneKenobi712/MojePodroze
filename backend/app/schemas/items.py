"""Schematy pozycji kosztowych: loty, transport, posiłki, noclegi i atrakcje, wydatki inne."""

from datetime import date, datetime
from typing import Annotated, Self

from pydantic import (
    BaseModel,
    Field,
    NaiveDatetime,
    StringConstraints,
    computed_field,
    model_validator,
)

from app.domain.enums import PlaceKind
from app.domain.stays import nights
from app.schemas.common import (
    ApiModel,
    DecimalOut,
    LongName,
    MoneyIn,
    Name,
    Note,
    Rating,
    ShortName,
)
from app.schemas.dictionaries import DictionaryEntryOut

FlightNumber = Annotated[
    str, StringConstraints(strip_whitespace=True, to_upper=True, min_length=2, max_length=10)
]
Dish = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class ItemOutBase(ApiModel):
    id: int
    trip_id: int
    cost: DecimalOut = Field(description="Koszt w PLN.")
    created_at: datetime


class RatedItemOutBase(ItemOutBase):
    rating: int | None


# --- Loty (tylko podróże zagraniczne) -------------------------------------------------------


class FlightIn(BaseModel):
    flight_number: FlightNumber = Field(examples=["LO 327"])
    departure_airport: ShortName = Field(examples=["Warszawa (WAW)"])
    arrival_airport: ShortName = Field(examples=["Rzym (FCO)"])
    departure_at: NaiveDatetime = Field(description="Data i godzina wylotu (czas lokalny).")
    arrival_at: NaiveDatetime | None = None
    cost: MoneyIn
    rating: Rating | None = None

    @model_validator(mode="after")
    def check_times(self) -> Self:
        if self.arrival_at is not None and self.arrival_at < self.departure_at:
            raise ValueError("Przylot nie może być wcześniejszy niż wylot.")
        return self


class FlightOut(RatedItemOutBase):
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_at: datetime
    arrival_at: datetime | None


# --- Transport ------------------------------------------------------------------------------


class TransportIn(BaseModel):
    transport_mean_id: int = Field(ge=1, description="Id z /api/dictionaries → transport_means.")
    route_from: ShortName = Field(examples=["Kraków"])
    route_to: ShortName = Field(examples=["Zakopane"])
    travel_date: date
    cost: MoneyIn
    rating: Rating | None = None


class TransportOut(RatedItemOutBase):
    transport_mean: DictionaryEntryOut
    route_from: str
    route_to: str
    travel_date: date


# --- Posiłki --------------------------------------------------------------------------------


class MealIn(BaseModel):
    dish: Dish = Field(description="Co było jedzone.", examples=["Pierogi ruskie"])
    restaurant_name: Name = Field(examples=["Bar Mleczny Pod Temidą"])
    meal_date: date
    cost: MoneyIn
    rating: Rating | None = Field(default=None, description="Jedna ocena: ocena restauracji 1–5.")


class MealOut(RatedItemOutBase):
    dish: str
    restaurant_name: str
    meal_date: date


# --- Noclegi i atrakcje ---------------------------------------------------------------------


class PlaceIn(BaseModel):
    name: Name = Field(examples=["Koloseum"])
    kind: PlaceKind
    visit_date: date = Field(description="Dzień atrakcji albo dzień zameldowania w noclegu.")
    check_out_date: date | None = Field(
        default=None,
        description="Tylko nocleg: dzień wymeldowania (późniejszy niż zameldowanie). "
        "Brak = jedna noc.",
    )
    cost: MoneyIn = Field(description="Koszt w PLN; dla noclegu – za cały pobyt.")
    rating: Rating | None = None
    note: Note | None = None

    @model_validator(mode="after")
    def check_check_out(self) -> Self:
        if self.check_out_date is None:
            return self
        if self.kind is not PlaceKind.ACCOMMODATION:
            raise ValueError("Datę wymeldowania można podać tylko dla noclegu.")
        if self.check_out_date <= self.visit_date:
            raise ValueError("Wymeldowanie musi być później niż zameldowanie.")
        return self


class PlaceOut(RatedItemOutBase):
    name: str
    kind: PlaceKind
    visit_date: date
    check_out_date: date | None
    note: str | None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def nights(self) -> int | None:
        """Liczba nocy noclegu; ``None`` dla atrakcji."""
        if self.kind is not PlaceKind.ACCOMMODATION:
            return None
        return nights(self.visit_date, self.check_out_date)


# --- Wydatki inne (bez oceny) ---------------------------------------------------------------


class ExpenseIn(BaseModel):
    category_id: int = Field(ge=1, description="Id z /api/dictionaries → expense_categories.")
    description: LongName = Field(examples=["Magnes na lodówkę"])
    expense_date: date | None = None
    cost: MoneyIn = Field(description="Kwota w PLN.")


class ExpenseOut(ItemOutBase):
    category: DictionaryEntryOut
    description: str
    expense_date: date | None
