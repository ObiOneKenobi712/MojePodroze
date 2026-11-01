import { useEffect, useState } from "react";
import type { CityImage } from "../types/api";
import { api, ApiError } from "../api/client";

// Wyniki według miasta, na czas otwartej strony: kilka podróży do Rzymu = jedno zapytanie.
// 404 (brak zdjęcia) też zapamiętujemy; awarię (503) – nie, żeby spróbować przy następnym wejściu.
const cache = new Map<string, Promise<CityImage | null>>();

function fetchCityImage(tripId: number, city: string): Promise<CityImage | null> {
  const key = city.trim().toLowerCase();
  let request = cache.get(key);
  if (!request) {
    request = api.get<CityImage>(`/trips/${tripId}/city-image`).catch((error: unknown) => {
      if (!(error instanceof ApiError && error.status === 404)) cache.delete(key);
      return null;
    });
    cache.set(key, request);
  }
  return request;
}

/** Zdjęcie miasta z Wikipedii, gdy `enabled` (podróż bez własnych zdjęć); inaczej i przy błędzie – null */
export function useCityImage(tripId: number, city: string, enabled: boolean): CityImage | null {
  const [result, setResult] = useState<{ key: string; image: CityImage | null } | null>(null);
  const key = `${tripId}:${city}`;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchCityImage(tripId, city).then((image) => {
      if (!cancelled) setResult({ key, image });
    });
    return () => {
      cancelled = true;
    };
  }, [tripId, city, enabled, key]);

  return enabled && result?.key === key ? result.image : null;
}
