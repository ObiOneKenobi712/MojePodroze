import { useEffect, useState } from "react";
import { api } from "../../api/client";
import styles from "./TripCard.module.css";

const PLACEHOLDERS = 5;

interface Props {
  tripId: number;
  /** `cover_photo_url` z podróży: wybrana okładka albo pierwsze zdjęcie; null – podróż bez zdjęć */
  coverUrl: string | null;
  /** Zdjęcie miasta z Wikipedii (adres zewnętrzny) – gdy podróż nie ma własnych zdjęć */
  cityImageUrl?: string | null;
  /** Klasa kontenera – domyślnie okładka karty; ekran szczegółów podaje własną (szeroki baner) */
  className?: string;
}

// Okładka: plik z `cover_photo_url` (wymaga X-User-Id, więc fetch → blob); bez zdjęć – zdjęcie miasta
// z Wikipedii (zwykłe <img src>) z podpisem „Fot. Wikipedia”. Bez obu albo przy błędzie zostaje kolor.
// Dekoracja – opis podróży jest w tekście obok.
export default function TripCover({ tripId, coverUrl, cityImageUrl = null, className = styles.cover }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [cityImageFailed, setCityImageFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!coverUrl) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .getBlob(coverUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        // brak zdjęcia nie jest błędem dla użytkownika – zostaje kolor
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setSrc(null);
    };
  }, [coverUrl]);

  const placeholder = `var(--placeholder-${(tripId % PLACEHOLDERS) + 1})`;
  const showCityImage = !coverUrl && cityImageUrl && cityImageFailed !== cityImageUrl;
  return (
    <div className={className} style={{ background: placeholder, position: "relative" }} aria-hidden="true">
      {src && <img src={src} alt="" className={styles.coverImage} data-testid="trip-cover-photo" />}
      {showCityImage && (
        <>
          <img
            src={cityImageUrl}
            alt=""
            className={styles.coverImage}
            onError={() => setCityImageFailed(cityImageUrl)}
            data-testid="trip-city-image"
          />
          <span className={styles.credit}>Fot. Wikipedia</span>
        </>
      )}
    </div>
  );
}
