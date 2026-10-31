import { useEffect, useState } from "react";
import type { Photo } from "../../types/api";
import { api } from "../../api/client";
import styles from "./TripCard.module.css";

const PLACEHOLDERS = 5;

interface Props {
  tripId: number;
  /** Klasa kontenera – domyślnie okładka karty; ekran szczegółów podaje własną (szeroki baner) */
  className?: string;
}

// Okładka: pierwsze zdjęcie podróży (GET /api/trips/{id}/photos → plik przez fetch → blob).
// Bez zdjęć albo przy błędzie zostaje kolor zastępczy. Dekoracja – opis podróży jest w tekście obok.
export default function TripCover({ tripId, className = styles.cover }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .get<Photo[]>(`/trips/${tripId}/photos`)
      .then((photos) => (photos.length > 0 ? api.getBlob(photos[0].file_url) : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        // brak zdjęcia nie jest błędem dla użytkownika – zostaje kolor
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tripId]);

  const placeholder = `var(--placeholder-${(tripId % PLACEHOLDERS) + 1})`;
  return (
    <div className={className} style={{ background: placeholder, position: "relative" }} aria-hidden="true">
      {src && <img src={src} alt="" className={styles.coverImage} data-testid="trip-cover-photo" />}
    </div>
  );
}
