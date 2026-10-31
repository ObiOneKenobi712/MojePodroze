import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import type { Section, Trip, TripStatus } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { capitalize, formatDate, formatPln } from "../../utils/format";
import StatusLabel from "../../components/StatusLabel/StatusLabel";
import TripCover from "../../components/TripCard/TripCover";
import TripAlbum from "../../components/TripAlbum/TripAlbum";
import { useTabIndicator } from "../../hooks/useTabIndicator";
import { useConfirm } from "../../hooks/useConfirm";
import ItemSection from "../../components/ItemSection/ItemSection";
import ChecklistSection from "../../components/ChecklistSection/ChecklistSection";
import CostSummaryPanel from "./CostSummaryPanel";
import { DIARY, EXPENSES, FLIGHTS, MEALS, PACKING, PLACES, PLAN, TRANSPORTS, WISHLIST } from "./sections";
import styles from "./TripDetailsPage.module.css";

interface Tab {
  key: string;
  label: string;
  /** Sekcja kosztowa – zakładka widoczna tylko, gdy backend ją zwraca w available_sections */
  section?: Section;
}

// Kolejność jak w makiecie 3
const TABS: Tab[] = [
  { key: "przeglad", label: "Przegląd" },
  { key: "plan", label: "Plan dnia" },
  { key: "loty", label: "Loty", section: "flights" },
  { key: "transport", label: "Transport", section: "transport" },
  { key: "posilki", label: "Posiłki", section: "meals" },
  { key: "noclegi", label: "Noclegi i atrakcje", section: "places" },
  { key: "wydatki", label: "Wydatki inne", section: "expenses" },
  { key: "chce-odwiedzic", label: "Chcę odwiedzić" },
  { key: "pakowanie", label: "Pakowanie" },
  { key: "pamietnik", label: "Pamiętnik" },
  { key: "kosztorys", label: "Kosztorys" },
];

const STATUS_ORDER: TripStatus[] = ["planned", "in_progress", "completed", "archived"];

// Napis na przycisku zmiany statusu „do przodu”; krok wstecz to zawsze „Cofnij”
const FORWARD_LABEL: Record<TripStatus, string> = {
  planned: "Zaplanuj",
  in_progress: "Rozpocznij podróż",
  completed: "Zakończ podróż",
  archived: "Przenieś do archiwum",
};

const STATUS_LABEL: Record<TripStatus, string> = {
  planned: "w planie",
  in_progress: "w trakcie",
  completed: "zrealizowana",
  archived: "archiwum",
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip }
  | { status: "error"; message: string };

// Szczegóły podróży (makieta 3): nagłówek, zmiana statusu (allowed_transitions z API), zakładki sekcji.
export default function TripDetailsPage() {
  const { tripId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const navigate = useNavigate();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const idPrefix = useId();
  const { confirm, confirmDialog } = useConfirm();

  // Zakładki liczymy przed wczesnymi `return` (hooki muszą być wywoływane zawsze w tej samej kolejności)
  const loadedTrip = load.status === "ready" ? load.trip : null;
  const tabs = loadedTrip
    ? TABS.filter((tab) => !tab.section || loadedTrip.available_sections.includes(tab.section))
    : [];
  const requestedTab = searchParams.get("zakladka");
  const activeTab = tabs.find((t) => t.key === requestedTab) ?? tabs[0];
  const activeIndex = activeTab ? tabs.indexOf(activeTab) : -1;
  const indicatorRef = useTabIndicator(tabRefs, activeIndex);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Trip>(`/trips/${tripId}`)
      .then((trip) => {
        if (!cancelled) setLoad({ status: "ready", trip });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiError && error.status === 404
            ? "Nie znaleziono podróży."
            : error instanceof ApiError
              ? error.message
              : "Nie udało się wczytać podróży.";
        setLoad({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, reloadKey]);

  if (load.status === "loading") {
    return (
      <p className={styles.muted} role="status" data-testid="trip-details-loading">
        Wczytywanie podróży…
      </p>
    );
  }

  if (load.status === "error") {
    return (
      <div className={styles.page}>
        <Link to="/podroze" className={styles.back} data-testid="link-back">
          <span className={styles.backArrow} aria-hidden="true">←</span> Moje podróże
        </Link>
        <div className={styles.error} role="alert" data-testid="trip-details-error">
          <p>{load.message}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setLoad({ status: "loading" });
              setReloadKey((k) => k + 1);
            }}
            data-testid="trip-details-retry"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const trip = load.trip;
  const activeKey = activeTab.key;
  const currentIndex = STATUS_ORDER.indexOf(trip.status);

  function selectTab(key: string) {
    setSearchParams(key === tabs[0].key ? {} : { zakladka: key }, { replace: true });
  }

  // Strzałki w lewo/prawo przełączają zakładki (wzorzec WAI-ARIA „Tabs”)
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  }

  // Usunięcie podróży ze wszystkim (pozycje, plan, zdjęcia) – nieodwracalne, więc z potwierdzeniem
  async function deleteTrip() {
    const confirmed = await confirm({
      title: "Usunąć podróż?",
      message: `„${trip.name}” zostanie usunięta razem ze wszystkimi wpisami i zdjęciami. Tego nie da się cofnąć.`,
      confirmLabel: "Usuń podróż",
    });
    if (!confirmed) return;
    setChanging(true);
    setStatusError(null);
    try {
      await api.delete(`/trips/${trip.id}`);
      navigate("/podroze", { replace: true });
    } catch (error) {
      setStatusError(error instanceof ApiError ? error.message : "Nie udało się usunąć podróży.");
      setChanging(false);
    }
  }

  async function changeStatus(status: TripStatus) {
    setChanging(true);
    setStatusError(null);
    try {
      const updated = await api.post<Trip>(`/trips/${trip.id}/status`, { status });
      setLoad({ status: "ready", trip: updated });
    } catch (error) {
      setStatusError(error instanceof ApiError ? error.message : "Nie udało się zmienić statusu.");
    } finally {
      setChanging(false);
    }
  }

  // Najpierw „Cofnij” (pomocniczy), potem krok do przodu (główny) – jak w makiecie
  // Wspólne dane dla sekcji z pozycjami (plan, koszty)
  const sectionProps = {
    tripId: trip.id,
    readOnly: trip.is_read_only,
    startDate: trip.start_date,
    endDate: trip.end_date,
  };

  const transitions = [...trip.allowed_transitions].sort(
    (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
  );

  return (
    <div className={styles.page} data-testid="trip-details">
      <Link to="/podroze" className={styles.back} data-testid="link-back">
        <span className={styles.backArrow} aria-hidden="true">←</span> Moje podróże
      </Link>

      <figure className={styles.coverFigure}>
        <TripCover tripId={trip.id} className={styles.cover} />
        <figcaption className={styles.caption}>
          {trip.destination_city}, {trip.destination_country}
        </figcaption>
      </figure>

      <div className={styles.header}>
        <div className={styles.headerText}>
          <StatusLabel status={trip.status} label={trip.status_label} />
          <h1 className={styles.title} data-testid="trip-details-title">
            {trip.name}
          </h1>
          <p className={styles.meta}>
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            <span aria-hidden="true"> · </span>
            <span className="visually-hidden">, </span>
            {capitalize(trip.trip_type_label)}
            <span aria-hidden="true"> · </span>
            <span className="visually-hidden">, </span>
            {trip.character.name}
          </p>
          {/* Archiwum jest tylko do odczytu – bez edycji i usuwania */}
          {!trip.is_read_only && (
            <div className={styles.tripActions}>
              <Link to={`/podroze/${trip.id}/edycja`} className={styles.smallButton} data-testid="btn-edit-trip">
                Edytuj
              </Link>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={deleteTrip}
                disabled={changing}
                data-testid="btn-delete-trip"
              >
                Usuń podróż
              </button>
            </div>
          )}
        </div>

        {transitions.length > 0 && (
          <div className={styles.statusActions}>
            {transitions.map((status) => {
              const forward = STATUS_ORDER.indexOf(status) > currentIndex;
              return (
                <button
                  key={status}
                  type="button"
                  className={forward ? styles.primary : styles.secondary}
                  onClick={() => changeStatus(status)}
                  disabled={changing}
                  aria-label={forward ? undefined : `Cofnij status do „${STATUS_LABEL[status]}”`}
                  data-testid={`btn-status-${status.replace("_", "-")}`}
                >
                  {forward ? FORWARD_LABEL[status] : "Cofnij"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {statusError && (
        <p className={styles.error} role="alert" data-testid="status-error">
          {statusError}
        </p>
      )}

      {trip.is_read_only && (
        <p className={styles.readOnly} data-testid="trip-readonly-notice">
          Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.
        </p>
      )}

      <div role="tablist" aria-label="Sekcje podróży" className={styles.tabs}>
        <span ref={indicatorRef} className={styles.tabIndicator} aria-hidden="true" />
        {tabs.map((tab, index) => {
          const selected = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              data-testid={`section-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        key={activeKey}
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${activeKey}`}
        className={styles.panel}
        data-testid="section-panel"
      >
        {activeTab.key === "przeglad" ? (
          <div className={styles.overviewPanel}>
            <dl className={styles.overview}>
              <div>
                <dt>Cel</dt>
                <dd>
                  {trip.destination_city}, {trip.destination_country}
                </dd>
              </div>
              <div>
                <dt>Termin</dt>
                <dd>
                  {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                </dd>
              </div>
              <div>
                <dt>Czas trwania</dt>
                <dd>{trip.duration_days === 1 ? "1 dzień" : `${trip.duration_days} dni`}</dd>
              </div>
              <div>
                <dt>Budżet</dt>
                <dd data-testid="trip-budget">
                  {trip.planned_budget === null ? "nie ustalono" : formatPln(trip.planned_budget)}
                </dd>
              </div>
            </dl>
            <section className={styles.albumSection} aria-labelledby={`${idPrefix}-album`}>
              <h2 id={`${idPrefix}-album`} className={styles.subtitle}>
                Zdjęcia
              </h2>
              <TripAlbum
                tripId={trip.id}
                startDate={trip.start_date}
                endDate={trip.end_date}
                readOnly={trip.is_read_only}
              />
            </section>
          </div>
        ) : activeTab.key === "plan" ? (
          <ItemSection config={PLAN} {...sectionProps} />
        ) : activeTab.key === "chce-odwiedzic" ? (
          <ChecklistSection config={WISHLIST} tripId={trip.id} readOnly={trip.is_read_only} />
        ) : activeTab.key === "pakowanie" ? (
          <ChecklistSection config={PACKING} tripId={trip.id} readOnly={trip.is_read_only} />
        ) : activeTab.key === "kosztorys" ? (
          <CostSummaryPanel tripId={trip.id} readOnly={trip.is_read_only} />
        ) : activeTab.key === "pamietnik" ? (
          <ItemSection config={DIARY} {...sectionProps} />
        ) : activeTab.key === "loty" ? (
          <ItemSection config={FLIGHTS} {...sectionProps} />
        ) : activeTab.key === "posilki" ? (
          <ItemSection config={MEALS} {...sectionProps} />
        ) : activeTab.key === "transport" ? (
          <ItemSection config={TRANSPORTS} {...sectionProps} />
        ) : activeTab.key === "noclegi" ? (
          <ItemSection config={PLACES} {...sectionProps} />
        ) : activeTab.key === "wydatki" ? (
          <ItemSection config={EXPENSES} {...sectionProps} />
        ) : (
          <p className={styles.muted}>Sekcja „{activeTab.label}” pojawi się w kolejnym kroku.</p>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
