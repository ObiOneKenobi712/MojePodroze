"""Noclegi: pobyt od dnia zameldowania do dnia wymeldowania (bez nocy wymeldowania).

Pobyt ``[check_in, check_out)`` zajmuje noce od ``check_in`` do dnia przed ``check_out``.
Nocleg bez daty wymeldowania to jedna noc. W danej podróży na jedną noc przypada
najwyżej jeden nocleg, więc pobyty 21.09–28.09 i 28.09–30.09 się nie nakładają.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, timedelta

from app.domain.errors import AccommodationOverlapError, DateOutsideTripError

ONE_NIGHT = timedelta(days=1)


def stay_end(check_in: date, check_out: date | None) -> date:
    """Dzień wymeldowania; bez podanej daty – dzień po zameldowaniu (jedna noc)."""
    return check_out if check_out is not None else check_in + ONE_NIGHT


def nights(check_in: date, check_out: date | None) -> int:
    """Liczba nocy pobytu."""
    return (stay_end(check_in, check_out) - check_in).days


@dataclass(frozen=True)
class Stay:
    """Nocleg w podróży; ``id`` jest ``None`` dla pozycji, której jeszcze nie zapisano."""

    id: int | None
    name: str
    check_in: date
    check_out: date | None = None

    @property
    def end(self) -> date:
        return stay_end(self.check_in, self.check_out)

    def overlaps(self, other: "Stay") -> bool:
        return self.check_in < other.end and other.check_in < self.end


def ensure_no_overlapping_stays(stay: Stay, existing: Iterable[Stay]) -> None:
    """Jeden nocleg na noc; edytowana pozycja (to samo ``id``) nie koliduje sama ze sobą."""
    for other in existing:
        if stay.id is not None and other.id == stay.id:
            continue
        if stay.overlaps(other):
            raise AccommodationOverlapError(
                f"W tym terminie jest już nocleg „{other.name}” "
                f"({other.check_in.isoformat()} – {other.end.isoformat()})."
            )


def ensure_check_out_within_trip(check_out: date | None, end_date: date) -> None:
    """Wymeldowanie najpóźniej w ostatnim dniu podróży."""
    if check_out is not None and check_out > end_date:
        raise DateOutsideTripError(
            f"Wymeldowanie {check_out.isoformat()} jest po zakończeniu podróży "
            f"({end_date.isoformat()})."
        )
