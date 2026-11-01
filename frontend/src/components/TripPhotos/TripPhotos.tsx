import { useEffect, useState } from "react";
import type { Photo } from "../../types/api";
import { api, ApiError } from "../../api/client";
import PhotoImage from "../PhotoImage/PhotoImage";
import PhotoEditDialog from "./PhotoEditDialog";
import { capitalize, formatDate } from "../../utils/format";
import { useConfirm } from "../../hooks/useConfirm";
import styles from "./TripPhotos.module.css";

interface Props {
  tripId: number;
  /** Zmiana wartości wczytuje zdjęcia ponownie (np. po wgraniu nowych) */
  refreshKey?: number;
  /** Pokaż przyciski usuwania (edycja podróży) */
  editable?: boolean;
  /** Wywoływane po usunięciu lub zmianie zdjęcia (np. odświeżenie okładki) */
  onChange?: () => void;
  /** Termin podróży – zakres dnia przy edycji zdjęcia */
  startDate?: string;
  endDate?: string;
  /** Wybrana okładka (`cover_photo_id`); null – okładką jest pierwsze zdjęcie */
  coverPhotoId?: number | null;
}

/** Kolejność jak w backendzie: dzień, potem kolejność dodania */
function byDay(a: Photo, b: Photo): number {
  return a.day.localeCompare(b.day) || a.uploaded_at.localeCompare(b.uploaded_at) || a.id - b.id;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; photos: Photo[] }
  | { status: "error"; message: string };

// Siatka wszystkich zdjęć podróży: GET /api/trips/{id}/photos, usuwanie: DELETE …/photos/{photoId}.
export default function TripPhotos({
  tripId,
  refreshKey = 0,
  editable = false,
  onChange,
  startDate,
  endDate,
  coverPhotoId = null,
}: Props) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [savingCover, setSavingCover] = useState(false);
  const { confirm, confirmDialog } = useConfirm();
  const [editing, setEditing] = useState<Photo | null>(null);

  // Po zapisie dnia lub podpisu: podmień zdjęcie i ułóż listę od nowa (okładka może się zmienić)
  function onSaved(saved: Photo) {
    setEditing(null);
    setLoad((current) =>
      current.status === "ready"
        ? { status: "ready", photos: current.photos.map((p) => (p.id === saved.id ? saved : p)).sort(byDay) }
        : current,
    );
    onChange?.();
  }

  useEffect(() => {
    let cancelled = false;
    api
      .get<Photo[]>(`/trips/${tripId}/photos`)
      .then((photos) => {
        if (!cancelled) setLoad({ status: "ready", photos });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoad({ status: "error", message: error instanceof ApiError ? error.message : "Nie udało się wczytać zdjęć." });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  async function remove(photo: Photo, label: string) {
    const confirmed = await confirm({
      title: "Usunąć zdjęcie?",
      message: `${photo.caption ? `Zdjęcie „${photo.caption}”` : capitalize(label)} zostanie usunięte z podróży. Tego nie da się cofnąć.`,
      confirmLabel: "Usuń zdjęcie",
    });
    if (!confirmed) return;
    setDeleteError(null);
    try {
      await api.delete(`/trips/${tripId}/photos/${photo.id}`);
      setLoad((current) =>
        current.status === "ready" ? { status: "ready", photos: current.photos.filter((p) => p.id !== photo.id) } : current,
      );
      onChange?.();
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Nie udało się usunąć zdjęcia.");
    }
  }

  // PUT /api/trips/{id}/cover – wybrane zdjęcie staje się okładką (karta, szczegóły)
  async function setCover(photo: Photo) {
    setCoverError(null);
    setSavingCover(true);
    try {
      await api.put(`/trips/${tripId}/cover`, { photo_id: photo.id });
      onChange?.();
    } catch (error) {
      setCoverError(error instanceof ApiError ? error.message : "Nie udało się ustawić okładki.");
    } finally {
      setSavingCover(false);
    }
  }

  if (load.status === "loading") {
    return (
      <p className={styles.muted} role="status" data-testid="trip-photos-loading">
        Wczytywanie zdjęć…
      </p>
    );
  }
  if (load.status === "error") {
    return (
      <p className={styles.error} role="alert" data-testid="trip-photos-error">
        {load.message}
      </p>
    );
  }
  if (load.photos.length === 0) {
    return (
      <p className={styles.muted} data-testid="trip-photos-empty">
        Ta podróż nie ma jeszcze zdjęć.
      </p>
    );
  }

  return (
    <>
      {deleteError && (
        <p className={styles.error} role="alert" data-testid="photo-delete-error">
          {deleteError}
        </p>
      )}
      {coverError && (
        <p className={styles.error} role="alert" data-testid="photo-cover-error">
          {coverError}
        </p>
      )}
      <ul className={styles.grid} aria-label="Zdjęcia podróży" data-testid="trip-photo-list">
        {load.photos.map((photo, index) => {
          const label = photo.caption ?? `zdjęcie ${index + 1}`;
          // Ta sama reguła co w backendzie: wybrana okładka, a bez wyboru – pierwsze zdjęcie
          const isCover = coverPhotoId === null ? index === 0 : photo.id === coverPhotoId;
          return (
            <li key={photo.id} className={styles.item} data-testid={`photo-${photo.id}`}>
              <PhotoImage photo={photo} alt={photo.caption ?? `Zdjęcie ${index + 1} z podróży`} className={styles.image} />
              {isCover && (
                <span className={styles.badge} data-testid={`photo-cover-badge-${photo.id}`}>
                  Okładka
                </span>
              )}
              {editable && (
                <p className={styles.meta} data-testid={`photo-day-${photo.id}`}>
                  {formatDate(photo.day)}
                  {photo.caption && <span className={styles.metaCaption}>{photo.caption}</span>}
                </p>
              )}
              {editable && !isCover && (
                <button
                  type="button"
                  className={styles.setCover}
                  onClick={() => setCover(photo)}
                  disabled={savingCover}
                  aria-label={`Ustaw jako okładkę: ${label}`}
                  data-testid={`btn-set-cover-${photo.id}`}
                >
                  Ustaw jako okładkę
                </button>
              )}
              {editable && (
                <button
                  type="button"
                  className={styles.edit}
                  onClick={() => setEditing(photo)}
                  aria-label={`Zmień dzień i podpis: ${label}`}
                  data-testid={`btn-edit-photo-${photo.id}`}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M4 20h4L19 9l-4-4L4 16v4z" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              {editable && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => remove(photo, label)}
                  aria-label={`Usuń ${label}`}
                  data-testid={`btn-delete-photo-${photo.id}`}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {confirmDialog}
      {editing && (
        <PhotoEditDialog
          tripId={tripId}
          photo={editing}
          startDate={startDate}
          endDate={endDate}
          onSaved={onSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
