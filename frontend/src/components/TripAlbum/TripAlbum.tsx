import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Link } from "react-router";
import type { AlbumDay, Photo } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate, tripDayNumber } from "../../utils/format";
import PhotoImage from "../PhotoImage/PhotoImage";
import styles from "./TripAlbum.module.css";

function photoAlt(photo: Photo): string {
  return photo.caption ?? `Zdjęcie z dnia ${formatDate(photo.day)}`;
}

interface ViewerProps {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

// Podgląd zdjęcia w powiększeniu: <dialog> (Esc zamyka, fokus zostaje w oknie), strzałki ← → przełączają.
function PhotoViewer({ photos, index, onIndexChange, onClose }: ViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photo = photos[index];
  const hasMany = photos.length > 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    // Po zamknięciu fokus wraca na miniaturę, która otworzyła podgląd
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => previous?.focus();
  }, []);

  function go(step: number) {
    onIndexChange((index + step + photos.length) % photos.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (!hasMany) return;
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else return;
    event.preventDefault();
  }

  // Kliknięcie w ciemne tło (poza zdjęciem i przyciskami) zamyka podgląd
  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label="Podgląd zdjęcia"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
      data-testid="photo-viewer"
    >
      <button
        type="button"
        className={`${styles.viewerButton} ${styles.close}`}
        onClick={onClose}
        aria-label="Zamknij podgląd"
        autoFocus
        data-testid="btn-viewer-close"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      <figure className={styles.viewerFigure}>
        {/* key: przy zmianie zdjęcia nowy element – bez mignięcia poprzedniego */}
        <PhotoImage key={photo.id} photo={photo} alt={photoAlt(photo)} className={styles.viewerImage} />
        <figcaption className={styles.viewerCaption}>
          {photo.caption && <span data-testid="photo-viewer-caption">{photo.caption}</span>}
          <span className={styles.viewerMeta}>
            {formatDate(photo.day)}
            {hasMany && (
              <>
                <span aria-hidden="true"> · </span>
                <span data-testid="photo-viewer-counter">
                  {index + 1} / {photos.length}
                </span>
              </>
            )}
          </span>
        </figcaption>
      </figure>

      {hasMany && (
        <>
          <button
            type="button"
            className={`${styles.viewerButton} ${styles.prev}`}
            onClick={() => go(-1)}
            aria-label="Poprzednie zdjęcie"
            data-testid="btn-viewer-prev"
          >
            ←
          </button>
          <button
            type="button"
            className={`${styles.viewerButton} ${styles.next}`}
            onClick={() => go(1)}
            aria-label="Następne zdjęcie"
            data-testid="btn-viewer-next"
          >
            →
          </button>
        </>
      )}
    </dialog>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; days: AlbumDay[] }
  | { status: "error"; message: string };

interface Props {
  tripId: number;
  startDate: string;
  endDate: string;
  /** Archiwum: bez podpowiedzi o dodawaniu zdjęć */
  readOnly: boolean;
}

// Album podróży (zakładka „Przegląd”): GET /api/trips/{id}/album – zdjęcia według dni, podgląd po kliknięciu.
export default function TripAlbum({ tripId, startDate, endDate, readOnly }: Props) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AlbumDay[]>(`/trips/${tripId}/album`)
      .then((days) => {
        if (!cancelled) setLoad({ status: "ready", days });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoad({ status: "error", message: error instanceof ApiError ? error.message : "Nie udało się wczytać zdjęć." });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, reloadKey]);

  if (load.status === "loading") {
    return (
      <p className={styles.muted} role="status" data-testid="album-loading">
        Wczytywanie zdjęć…
      </p>
    );
  }

  if (load.status === "error") {
    return (
      <div className={styles.error} role="alert" data-testid="album-error">
        <p>{load.message}</p>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            setLoad({ status: "loading" });
            setReloadKey((k) => k + 1);
          }}
          data-testid="album-retry"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (load.days.length === 0) {
    return (
      <p className={styles.muted} data-testid="album-empty">
        Ta podróż nie ma jeszcze zdjęć.
        {!readOnly && (
          <>
            {" "}
            <Link to={`/podroze/${tripId}/edycja`} className={styles.link} data-testid="link-add-photos">
              Dodaj je w edycji podróży
            </Link>
            .
          </>
        )}
      </p>
    );
  }

  // Wszystkie zdjęcia po kolei – podgląd przechodzi strzałkami także między dniami
  const allPhotos = load.days.flatMap((d) => d.photos);

  return (
    <div className={styles.album} data-testid="trip-album">
      {load.days.map((group) => {
        const n = tripDayNumber(group.day, startDate, endDate);
        return (
          <section key={group.day} className={styles.day} data-testid={`album-day-${group.day}`}>
            <h3 className={styles.dayTitle}>
              {n !== null && <>Dzień {n} · </>}
              {formatDate(group.day)}
            </h3>
            <ul className={styles.grid}>
              {group.photos.map((photo) => (
                <li key={photo.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.thumb}
                    onClick={() => setViewerIndex(allPhotos.indexOf(photo))}
                    // Nazwa przycisku także wtedy, gdy zdjęcie jeszcze się wczytuje
                    aria-label={`Powiększ: ${photoAlt(photo)}`}
                    data-testid={`album-photo-${photo.id}`}
                  >
                    <PhotoImage photo={photo} alt={photoAlt(photo)} className={styles.image} />
                  </button>
                  {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={allPhotos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
