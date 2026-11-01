import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Budget, CostSummary, Recommendation, Recommendations } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate, formatDecimal, formatPln } from "../../utils/format";
import styles from "./CostSummaryPanel.module.css";

type Load<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error"; message: string };

/** Pobranie danych z API z obsługą anulowania (przy zmianie zakładki) i ponowienia */
function useApi<T>(path: string, fallbackError: string): [Load<T>, () => void] {
  const [load, setLoad] = useState<Load<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setLoad({ status: "ready", data });
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: e instanceof ApiError ? e.message : fallbackError });
      });
    return () => {
      cancelled = true;
    };
  }, [path, fallbackError, reloadKey]);
  return [
    load,
    () => {
      setLoad({ status: "loading" });
      setReloadKey((k) => k + 1);
    },
  ];
}

/** 1 ocena, 2–4 oceny, 5+ ocen (12–14 ocen) */
function ratingsLabel(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (count === 1) return "1 ocena";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} oceny`;
  return `${count} ocen`;
}

/** Ocena z gwiazdką: „4,3 / 5” (+ liczba ocen dla czytników i na ekranie) */
function RatingText({ value, count }: { value: number | null; count: number }) {
  if (value === null) return <span className={styles.muted}>brak ocen</span>;
  return (
    <span>
      <span aria-hidden="true">★ </span>
      {formatDecimal(value)} / 5 <span className={styles.muted}>({ratingsLabel(count)})</span>
    </span>
  );
}

/** Budżet: napis + pasek; kolor zależy od alert_level z backendu, ale stan zawsze opisany słowami */
function BudgetBlock({ budget, tripId, readOnly }: { budget: Budget; tripId: number; readOnly: boolean }) {
  if (budget.alert_level === "no_budget" || budget.planned_budget === null) {
    return (
      <div className={styles.budget} data-testid="budget" data-level="no_budget">
        <p className={styles.budgetTitle}>Budżet</p>
        <p data-testid="budget-status">
          Nie ustalono budżetu.
          {!readOnly && (
            <>
              {" "}
              <Link to={`/podroze/${tripId}/edycja`} className={styles.link}>
                Ustaw go w edycji podróży
              </Link>
              .
            </>
          )}
        </p>
      </div>
    );
  }

  const percent = budget.usage_percent ?? 0;
  const status =
    budget.alert_level === "exceeded"
      ? `Budżet przekroczony o ${formatPln(budget.overrun ?? 0)}.`
      : budget.alert_level === "warning"
        ? `Uwaga: wykorzystano ${formatDecimal(percent)}% budżetu – zostało ${formatPln(budget.remaining ?? 0)}.`
        : `W budżecie – zostało ${formatPln(budget.remaining ?? 0)}.`;

  return (
    <div className={`${styles.budget} ${styles[budget.alert_level]}`} data-testid="budget" data-level={budget.alert_level}>
      <p className={styles.budgetTitle}>Budżet</p>
      <p className={styles.budgetNumbers}>
        Wydano <strong>{formatPln(budget.spent)}</strong> z {formatPln(budget.planned_budget)} ({formatDecimal(percent)}%)
      </p>
      {/* Pasek tylko dla oka – liczby są w tekście */}
      <span className={styles.bar} aria-hidden="true">
        <span style={{ width: `${Math.min(percent, 100)}%` }} />
      </span>
      <p className={styles.budgetStatus} data-testid="budget-status">
        {status}
      </p>
    </div>
  );
}

function RecommendationList({ title, items, testId }: { title: string; items: Recommendation[]; testId: string }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.recGroup}>
      <h4 className={styles.recTitle}>{title}</h4>
      <ul className={styles.recList}>
        {items.map((r, index) => (
          <li key={`${r.category}-${r.name}`} data-testid={`${testId}-${index}`}>
            <span className={styles.recName}>{r.name}</span>{" "}
            <RatingText value={r.average_rating} count={r.ratings_count} />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  tripId: number;
  readOnly: boolean;
}

// Zakładka „Kosztorys”: GET /cost-summary (sumy, budżet, oceny) i osobno GET /recommendations
// (z wcześniejszych podróży do tego miasta) – błąd rekomendacji nie psuje kosztorysu.
export default function CostSummaryPanel({ tripId, readOnly }: Props) {
  const [summary, retrySummary] = useApi<CostSummary>(`/trips/${tripId}/cost-summary`, "Nie udało się wczytać kosztorysu.");
  const [recs, retryRecs] = useApi<Recommendations>(
    `/trips/${tripId}/recommendations?min_rating=4&limit=5`,
    "Nie udało się wczytać rekomendacji.",
  );

  return (
    <div className={styles.panel}>
      <section aria-labelledby="cost-summary-title" data-testid="cost-summary">
        <h2 id="cost-summary-title" className={styles.title}>
          Kosztorys
        </h2>

        {summary.status === "loading" ? (
          <p className={styles.muted} role="status" data-testid="cost-summary-loading">
            Wczytywanie kosztorysu…
          </p>
        ) : summary.status === "error" ? (
          <div className={styles.error} role="alert" data-testid="cost-summary-error">
            <p>{summary.message}</p>
            <button type="button" className={styles.secondary} onClick={retrySummary} data-testid="cost-summary-retry">
              Spróbuj ponownie
            </button>
          </div>
        ) : (
          <div className={styles.summary}>
            <dl className={styles.stats}>
              <div>
                <dt>Razem</dt>
                <dd className={styles.big} data-testid="cost-total">
                  {formatPln(summary.data.total_cost)}
                </dd>
              </div>
              <div>
                <dt>Średnio na dzień</dt>
                <dd data-testid="cost-daily">
                  {formatPln(summary.data.average_daily_cost)}
                  <span className={styles.muted}>
                    {" "}
                    ({summary.data.trip_days === 1 ? "1 dzień" : `${summary.data.trip_days} dni`})
                  </span>
                </dd>
              </div>
              <div>
                <dt>Ocena zbiorcza</dt>
                <dd data-testid="cost-rating">
                  <RatingText value={summary.data.average_rating} count={summary.data.rated_items_count} />
                </dd>
              </div>
            </dl>

            <BudgetBlock budget={summary.data.budget} tripId={tripId} readOnly={readOnly} />

            <table className={styles.table} data-testid="cost-sections">
              <caption className="visually-hidden">Koszty według sekcji</caption>
              <thead>
                <tr>
                  <th scope="col">Sekcja</th>
                  <th scope="col" className={styles.num}>
                    Pozycje
                  </th>
                  <th scope="col">Średnia ocena</th>
                  <th scope="col" className={styles.num}>
                    Suma
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.data.sections.map((s) => (
                  <tr key={s.section} data-testid={`cost-section-${s.section}`}>
                    <th scope="row">{s.label.charAt(0).toUpperCase() + s.label.slice(1)}</th>
                    <td className={styles.num}>{s.items_count}</td>
                    <td>
                      {s.section === "expenses" ? (
                        <span className={styles.muted}>bez ocen</span>
                      ) : (
                        <RatingText value={s.average_rating} count={s.rated_items_count} />
                      )}
                    </td>
                    <td className={styles.num}>{formatPln(s.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Razem</th>
                  <td className={styles.num}>{summary.data.sections.reduce((n, s) => n + s.items_count, 0)}</td>
                  <td />
                  <td className={styles.num}>{formatPln(summary.data.total_cost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className={styles.recs} aria-labelledby="recommendations-title" data-testid="recommendations">
        <h3 id="recommendations-title" className={styles.subtitle}>
          Polecane z wcześniejszych podróży
        </h3>
        {recs.status === "loading" ? (
          <p className={styles.muted} role="status" data-testid="recommendations-loading">
            Wczytywanie rekomendacji…
          </p>
        ) : recs.status === "error" ? (
          <div className={styles.error} role="alert" data-testid="recommendations-error">
            <p>{recs.message}</p>
            <button type="button" className={styles.secondary} onClick={retryRecs} data-testid="recommendations-retry">
              Spróbuj ponownie
            </button>
          </div>
        ) : recs.data.previous_trips.length === 0 ? (
          <p className={styles.muted} data-testid="recommendations-empty">
            To pierwsza podróż do miasta {recs.data.destination_city}. Gdy wrócisz tu kolejny raz, pokażemy najlepiej
            ocenione restauracje i miejsca z tej podróży.
          </p>
        ) : (
          <div className={styles.recBody}>
            <p>
              Wcześniejsze podróże do miasta {recs.data.destination_city}:{" "}
              {recs.data.previous_trips.map((t, index) => (
                <span key={t.id}>
                  {index > 0 && ", "}
                  <Link to={`/podroze/${t.id}`} className={styles.link} data-testid={`rec-previous-trip-${t.id}`}>
                    {t.name}
                  </Link>{" "}
                  <span className={styles.muted}>
                    ({formatDate(t.start_date)} – {formatDate(t.end_date)})
                  </span>
                </span>
              ))}
            </p>
            <RecommendationList title="Restauracje" items={recs.data.restaurants} testId="rec-restaurant" />
            <RecommendationList title="Noclegi i atrakcje" items={recs.data.places} testId="rec-place" />
            {recs.data.pending_wishlist.length > 0 && (
              <div className={styles.recGroup}>
                <h4 className={styles.recTitle}>Nie udało się wtedy zobaczyć</h4>
                <ul className={styles.recList}>
                  {recs.data.pending_wishlist.map((w, index) => (
                    <li key={w.name} data-testid={`rec-wish-${index}`}>
                      {w.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recs.data.restaurants.length === 0 &&
              recs.data.places.length === 0 &&
              recs.data.pending_wishlist.length === 0 && (
                <p className={styles.muted} data-testid="recommendations-none">
                  Brak wysoko ocenionych miejsc ani niezaliczonych punktów z tamtych podróży.
                </p>
              )}
          </div>
        )}
      </section>
    </div>
  );
}
