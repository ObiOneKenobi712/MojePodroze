from datetime import date, datetime
from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.domain.common import trip_length_days
from app.domain.enums import Section, TripStatus, TripType
from app.domain.items import allowed_sections
from app.domain.status import allowed_transitions, is_read_only
from app.schemas.common import ApiModel, DecimalOut, ShortName, TripName
from app.schemas.dictionaries import DictionaryEntryOut


class TripIn(BaseModel):
    """Dane podróży z formularza (tworzenie i pełna edycja)."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Majówka w Rzymie",
                    "destination_city": "Rzym",
                    "destination_country": "Włochy",
                    "start_date": "2027-05-01",
                    "end_date": "2027-05-05",
                    "trip_type": "foreign",
                    "character_id": 3,
                    "planned_budget": 4500,
                }
            ]
        }
    )

    name: TripName
    destination_city: ShortName
    destination_country: ShortName
    start_date: date
    end_date: date
    trip_type: TripType
    character_id: int = Field(ge=1, description="Id z /api/dictionaries → trip_characters.")
    planned_budget: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2, description="Budżet w PLN."
    )

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.end_date < self.start_date:
            raise ValueError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.")
        return self


class TripStatusIn(BaseModel):
    status: TripStatus = Field(description="Docelowy status (o jeden krok od obecnego).")


class TripCoverIn(BaseModel):
    photo_id: int | None = Field(
        ge=1,
        description="Id zdjęcia tej podróży albo null – okładką będzie pierwsze zdjęcie albumu.",
        examples=[12],
    )


class TripOut(ApiModel):
    id: int
    name: str
    destination_city: str
    destination_country: str
    start_date: date
    end_date: date
    trip_type: TripType
    character: DictionaryEntryOut
    status: TripStatus
    planned_budget: DecimalOut | None
    cover_photo_id: int | None = Field(
        default=None, description="Wybrana okładka; null = pierwsze zdjęcie albumu."
    )
    effective_cover_photo_id: int | None = Field(default=None, exclude=True)
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def status_label(self) -> str:
        return self.status.label

    @computed_field  # type: ignore[prop-decorator]
    @property
    def trip_type_label(self) -> str:
        return self.trip_type.label

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cover_photo_url(self) -> str | None:
        """Plik okładki (wybranej albo pierwszego zdjęcia); null, gdy podróż nie ma zdjęć.

        Wymaga nagłówka X-User-Id, tak jak ``file_url`` zdjęcia.
        """
        if self.effective_cover_photo_id is None:
            return None
        return f"/api/trips/{self.id}/photos/{self.effective_cover_photo_id}/file"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def duration_days(self) -> int:
        return trip_length_days(self.start_date, self.end_date)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def allowed_transitions(self) -> list[TripStatus]:
        """Statusy, na które GUI może zaproponować zmianę."""
        return list(allowed_transitions(self.status))

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_read_only(self) -> bool:
        return is_read_only(self.status)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def available_sections(self) -> list[Section]:
        """Sekcje pozycji dostępne dla typu podróży (np. loty tylko dla zagranicznej)."""
        return list(allowed_sections(self.trip_type))
