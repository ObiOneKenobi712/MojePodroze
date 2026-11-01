"""Błędy reguł biznesowych. Warstwa API tłumaczy je na odpowiedzi HTTP (zwykle 409).

Każdy błąd ma stały ``code``, na którym może polegać frontend i testy E2E.
"""


class DomainError(Exception):
    code = "DOMAIN_ERROR"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidStatusTransitionError(DomainError):
    code = "INVALID_STATUS_TRANSITION"


class TripReadOnlyError(DomainError):
    code = "TRIP_ARCHIVED"


class SectionNotAllowedError(DomainError):
    code = "SECTION_NOT_ALLOWED"


class TripTypeChangeBlockedError(DomainError):
    code = "TRIP_TYPE_CHANGE_BLOCKED"


class DateOutsideTripError(DomainError):
    code = "DATE_OUTSIDE_TRIP"


class FlightTooLongError(DomainError):
    code = "FLIGHT_TOO_LONG"


class AccommodationOverlapError(DomainError):
    code = "ACCOMMODATION_OVERLAP"
