import { useEffect, useState } from "react";
import type { Statistics } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatPln } from "../../utils/format";
import styles from "./StatsPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; stats: Statistics }
  | { status: "error"; message: string };

/** 1 podróż, 2–4 podróże, 5+ podróży (12–14 podróży) */
function tripsLabel(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (count === 1) return "1 podróż";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} podróże`;
  return `${count} podróży`;
}

// Statystyki (GET /api/stats): tylko podróże zrealizowane i w archiwum.
// Kafle z liczbami, dwa wykresy jednej serii (słupki w kolorze szałwii, wartości podpisane) i tabela.
export default function StatsPage() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Statistics>("/stats")
      .then((stats) => {
        if (!cancelled) setLoad({ status: "ready", stats });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLoad({ status: "error", message: e instanceof ApiError ? e.message : "Nie udało się wczytać statystyk." });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className={styles.page} data-testid="stats">
      <header className={styles.header}>
        <h1 className={styles.title}>Statystyki</h1>
        <p className={styles.muted}>Liczone z podróży zrealizowanych i przeniesionych do archiwum.</p>
      </header>

      {load.status === "loading" ? (
        <p className={styles.muted} role="status" data-testid="stats-loading">
          Wczytywanie statystyk…
        </p>
      ) : load.status === "error" ? (
        <div className={styles.error} role="alert" data-testid="stats-error">
          <p>{load.message}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setLoad({ status: "loading" });
              setReloadKey((k) => k + 1);
            }}
            data-testid="stats-retry"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : load.stats.realized_trips_count === 0 ? (
        <p className={styles.empty} data-testid="stats-empty">
          Statystyki pojawią się, gdy pierwsza podróż będzie miała status „Zrealizowana”.
        </p>
      ) : (
        <StatsContent stats={load.stats} />
      )}
    </div>
  );
}

function StatsContent({ stats }: { stats: Statistics }) {
  const maxYear = Math.max(...stats.trips_per_year.map((y) => y.trips_count), 1);
  // Porównanie charakterów po średnim koszcie dnia – podróże mają różną długość
  const byDaily = [...stats.cost_by_character].sort((a, b) => b.average_daily_cost - a.average_daily_cost);
  const maxDaily = Math.max(...byDaily.map((c) => c.average_daily_cost), 1);

  return (
    <>
      <dl className={styles.tiles}>
        <div className={styles.tile}>
          <dt>Zrealizowane podróże</dt>
          <dd data-testid="stats-trips-count">{stats.realized_trips_count}</dd>
        </div>
        <div className={styles.tile}>
          <dt>Łączny koszt</dt>
          <dd data-testid="stats-total-cost">{formatPln(stats.total_cost)}</dd>
        </div>
        <div className={styles.tile}>
          <dt>Średni koszt podróży</dt>
          <dd data-testid="stats-average-trip">
            {stats.average_trip_cost === null ? "—" : formatPln(stats.average_trip_cost)}
          </dd>
        </div>
        <div className={styles.tile}>
          <dt>Średni koszt dnia</dt>
          <dd data-testid="stats-average-daily">
            {stats.average_daily_cost === null ? "—" : formatPln(stats.average_daily_cost)}
          </dd>
        </div>
      </dl>

      <section className={styles.card} aria-labelledby="stats-years-title" data-testid="stats-years">
        <h2 id="stats-years-title" className={styles.cardTitle}>
          Podróże w kolejnych latach
        </h2>
        {/* Każdy słupek ma podpisaną wartość i rok – wykres czytelny bez osi; dla czytników lista lat */}
        <ul className={styles.columns}>
          {stats.trips_per_year.map((y) => (
            <li key={y.year} className={styles.column} data-testid={`stats-year-${y.year}`}>
              <span className={styles.columnValue}>{y.trips_count}</span>
              <span className={styles.columnTrack} aria-hidden="true">
                <span className={styles.columnBar} style={{ height: `${(y.trips_count / maxYear) * 100}%` }} />
              </span>
              <span className={styles.columnLabel}>
                {y.year}
                <span className="visually-hidden">: {tripsLabel(y.trips_count)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="stats-character-title" data-testid="stats-character">
        <h2 id="stats-character-title" className={styles.cardTitle}>
          Koszty według charakteru podróży
        </h2>
        <p className={styles.muted}>Średni koszt jednego dnia – porównywalny dla krótkich i długich podróży.</p>
        {/* Wykres dla oka; te same liczby (i więcej) są w tabeli pod spodem */}
        <ul className={styles.bars} aria-hidden="true">
          {byDaily.map((c) => (
            <li key={c.character} className={styles.barRow}>
              <span className={styles.barLabel}>{c.character}</span>
              <span className={styles.barTrack}>
                {/* Długość proporcjonalna do kwoty; 110 px zostaje na podpis wartości na końcu słupka */}
                <span
                  className={styles.bar}
                  style={{ width: `calc((100% - 110px) * ${c.average_daily_cost / maxDaily})` }}
                />
                <span className={styles.barValue}>{formatPln(c.average_daily_cost)}</span>
                {/* Podpowiedź po najechaniu: szczegóły charakteru */}
                <span className={styles.tooltip}>
                  {c.character}: {tripsLabel(c.trips_count)}, razem {formatPln(c.total_cost)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <table className={styles.table} data-testid="stats-character-table">
          <caption className="visually-hidden">Koszty według charakteru podróży</caption>
          <thead>
            <tr>
              <th scope="col">Charakter</th>
              <th scope="col" className={styles.num}>
                Podróże
              </th>
              <th scope="col" className={styles.num}>
                Razem
              </th>
              <th scope="col" className={styles.num}>
                Średnio na podróż
              </th>
              <th scope="col" className={styles.num}>
                Średnio na dzień
              </th>
            </tr>
          </thead>
          <tbody>
            {byDaily.map((c) => (
              <tr key={c.character} data-testid={`stats-character-${c.character}`}>
                <th scope="row">{c.character}</th>
                <td className={styles.num}>{c.trips_count}</td>
                <td className={styles.num}>{formatPln(c.total_cost)}</td>
                <td className={styles.num}>{formatPln(c.average_cost)}</td>
                <td className={styles.num}>{formatPln(c.average_daily_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
