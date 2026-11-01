"""Album zdjęć układany automatycznie według dni."""

from collections import defaultdict
from collections.abc import Callable, Iterable, Sequence
from datetime import date


def group_by_day[T](items: Iterable[T], day_of: Callable[[T], date]) -> list[tuple[date, list[T]]]:
    """Grupuje elementy po dniu; dni rosnąco, kolejność wewnątrz dnia jak na wejściu."""
    groups: dict[date, list[T]] = defaultdict(list)
    for item in items:
        groups[day_of(item)].append(item)
    return sorted(groups.items(), key=lambda pair: pair[0])


def pick_cover(cover_photo_id: int | None, ordered_photo_ids: Sequence[int]) -> int | None:
    """Okładka podróży: wybrane zdjęcie, a bez wyboru – pierwsze zdjęcie albumu."""
    if cover_photo_id is not None and cover_photo_id in ordered_photo_ids:
        return cover_photo_id
    return ordered_photo_ids[0] if ordered_photo_ids else None
