from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.api.deps import CurrentUser, DbSession, OwnedTrip, Storage
from app.api.responses import READ, UNAUTHORIZED, VALIDATION, WRITE
from app.domain.enums import TripStatus
from app.schemas.trips import TripCoverIn, TripIn, TripOut, TripStatusIn
from app.services import trips as trips_service

router = APIRouter(prefix="/trips", tags=["Podróże"])


@router.get(
    "",
    summary="Lista podróży",
    responses=UNAUTHORIZED,
    name="list_trips",
)
def list_trips(
    user: CurrentUser,
    db: DbSession,
    status_filter: Annotated[
        TripStatus | None, Query(alias="status", description="Filtr po statusie.")
    ] = None,
) -> list[TripOut]:
    trips = trips_service.list_trips(db, user, status_filter)
    return [TripOut.model_validate(trip) for trip in trips]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Utwórz podróż",
    description=(
        "Nowa podróż ma status „w planie”. Dla podróży zagranicznej lista pakowania dostaje "
        "automatycznie: paszport/dowód, ubezpieczenie, przejściówkę."
    ),
    responses={**UNAUTHORIZED, **VALIDATION},
    name="create_trip",
)
def create_trip(payload: TripIn, user: CurrentUser, db: DbSession) -> TripOut:
    return TripOut.model_validate(trips_service.create_trip(db, user, payload))


@router.get("/{trip_id}", summary="Szczegóły podróży", responses=READ, name="get_trip")
def get_trip(trip: OwnedTrip) -> TripOut:
    return TripOut.model_validate(trip)


@router.put(
    "/{trip_id}",
    summary="Edytuj podróż",
    description=(
        "Pełna edycja danych podróży. Archiwum → 409 TRIP_ARCHIVED. Zmiana typu na krajową, "
        "gdy podróż ma loty → 409 TRIP_TYPE_CHANGE_BLOCKED („usuń najpierw loty”)."
    ),
    responses=WRITE,
    name="update_trip",
)
def update_trip(payload: TripIn, trip: OwnedTrip, db: DbSession) -> TripOut:
    return TripOut.model_validate(trips_service.update_trip(db, trip, payload))


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Usuń podróż",
    description="Usuwa podróż razem z pozycjami i plikami zdjęć. Archiwum → 409.",
    responses=WRITE,
    name="delete_trip",
)
def delete_trip(trip: OwnedTrip, db: DbSession, storage: Storage) -> None:
    trips_service.delete_trip(db, trip, storage)


@router.post(
    "/{trip_id}/status",
    summary="Zmień status podróży",
    description=(
        "Maszyna stanów: w planie ⇄ w trakcie ⇄ zrealizowana ⇄ archiwum. Zawsze o jeden krok "
        "do przodu lub wstecz; przeskok → 409 INVALID_STATUS_TRANSITION. Dozwolone cele są "
        "w polu `allowed_transitions` podróży."
    ),
    responses=WRITE,
    name="change_trip_status",
)
def change_status(payload: TripStatusIn, trip: OwnedTrip, db: DbSession) -> TripOut:
    return TripOut.model_validate(trips_service.change_status(db, trip, payload.status))


@router.put(
    "/{trip_id}/cover",
    summary="Ustaw okładkę podróży",
    description=(
        "Wybiera zdjęcie tej podróży jako okładkę; `photo_id: null` przywraca domyślną "
        "(pierwsze zdjęcie albumu). Zdjęcie innej podróży → 404. Archiwum → 409 TRIP_ARCHIVED. "
        "Usunięcie zdjęcia-okładki przywraca okładkę domyślną."
    ),
    responses=WRITE,
    name="set_trip_cover",
)
def set_cover(payload: TripCoverIn, trip: OwnedTrip, db: DbSession) -> TripOut:
    return TripOut.model_validate(trips_service.set_cover(db, trip, payload.photo_id))
