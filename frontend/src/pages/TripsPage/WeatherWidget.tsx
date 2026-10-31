import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import type { CitySearchResult, WeatherResponse } from "../../types/api";
import { api, ApiError } from "../../api/client";
import Widget from "../../components/Widget/Widget";
import styles from "./TripsPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: WeatherResponse }
  | { status: "error"; message: string };

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function cityLabel(city: { name: string; country: string | null; region?: string | null }): string {
  return [city.name, city.region, city.country].filter(Boolean).join(", ");
}

// Pogoda dla miasta użytkownika (GET /api/weather/current), zmiana miasta: wyszukanie
// (GET /api/weather/cities) i zapis (PUT /api/users/me/weather-city). Błąd tylko w tym widżecie.
export default function WeatherWidget() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    api
      .get<WeatherResponse>("/weather/current")
      .then((data) => {
        if (!cancelled) setLoad({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: errorMessage(error, "Nie udało się pobrać pogody.") });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setLoad({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    setResults(null);
    if (q.length < 2) {
      setSearchError("Wpisz co najmniej 2 litery nazwy miasta.");
      return;
    }
    setSearchError(null);
    setBusy(true);
    try {
      const found = await api.get<CitySearchResult[]>(`/weather/cities?query=${encodeURIComponent(q)}&limit=5`);
      if (found.length === 0) setSearchError(`Nie znaleziono miasta „${q}”.`);
      else setResults(found);
    } catch (error) {
      setSearchError(errorMessage(error, "Nie udało się wyszukać miasta."));
    } finally {
      setBusy(false);
    }
  }

  async function chooseCity(city: CitySearchResult) {
    setBusy(true);
    try {
      await api.put("/users/me/weather-city", {
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      });
      setQuery("");
      setResults(null);
      reload();
    } catch (error) {
      setSearchError(errorMessage(error, "Nie udało się zapisać miasta."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Widget title="Pogoda" accent="--widget-weather" testId="widget-weather">
      {load.status === "loading" ? (
        <p className={styles.muted} role="status" data-testid="weather-loading">
          Wczytywanie pogody…
        </p>
      ) : load.status === "error" ? (
        <div className={styles.widgetError} role="alert" data-testid="weather-error">
          <p>{load.message}</p>
          <button type="button" className={styles.secondary} onClick={reload} data-testid="weather-retry">
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <div data-testid="weather-current">
          <p className={styles.weatherCity} data-testid="weather-city-name">
            {cityLabel(load.data.city)}
          </p>
          <p className={styles.weather}>
            <span className={styles.temperature}>{Math.round(load.data.weather.temperature_c)}°C</span>{" "}
            <span className={styles.muted}>{load.data.weather.description.toLowerCase()}</span>
          </p>
          {load.data.weather.apparent_temperature_c !== null && (
            <p className={styles.muted}>
              Odczuwalna {Math.round(load.data.weather.apparent_temperature_c)}°C
              {load.data.weather.wind_speed_kmh !== null &&
                ` · wiatr ${Math.round(load.data.weather.wind_speed_kmh)} km/h`}
            </p>
          )}
        </div>
      )}

      <form className={styles.citySearch} onSubmit={search} noValidate>
        <label htmlFor={id} className={styles.label}>
          Zmień miasto
        </label>
        <div className={styles.citySearchRow}>
          <input
            id={id}
            type="search"
            className={styles.field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={searchError ? `${id}-error` : undefined}
            data-testid="input-weather-city"
          />
          <button
            type="submit"
            className={`${styles.primary} ${styles.compact}`}
            disabled={busy}
            data-testid="btn-weather-search"
          >
            {busy ? "Szukam…" : "Szukaj"}
          </button>
        </div>
        {searchError && (
          <p id={`${id}-error`} className={styles.fieldError} role="alert" data-testid="weather-search-error">
            {searchError}
          </p>
        )}
      </form>

      {results && (
        <ul className={styles.cityList} aria-label="Znalezione miasta" data-testid="weather-city-results">
          {results.map((city, index) => (
            <li key={`${city.latitude},${city.longitude}`}>
              <button
                type="button"
                className={styles.cityOption}
                onClick={() => chooseCity(city)}
                disabled={busy}
                data-testid={`weather-city-option-${index}`}
              >
                {cityLabel(city)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
