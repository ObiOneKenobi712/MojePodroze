import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import type { Photo } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate } from "../../utils/format";
import PhotoImage from "../PhotoImage/PhotoImage";
import styles from "./PhotoEditDialog.module.css";

interface Props {
  tripId: number;
  photo: Photo;
  /** Termin podróży – dzień zdjęcia musi się w nim mieścić */
  startDate?: string;
  endDate?: string;
  onSaved: (photo: Photo) => void;
  onClose: () => void;
}

// Okno edycji zdjęcia: dzień albumu i podpis (PATCH /api/trips/{id}/photos/{photoId}).
export default function PhotoEditDialog({ tripId, photo, startDate, endDate, onSaved, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [day, setDay] = useState(photo.day);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [dayError, setDayError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Po zamknięciu fokus wraca na przycisk, który otworzył okno
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => previous?.focus();
  }, []);

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = caption.trim();
    const outside = startDate !== undefined && endDate !== undefined && (day < startDate || day > endDate);
    setDayError(
      day === ""
        ? "Wybierz dzień."
        : outside
          ? `Wybierz dzień w terminie podróży: ${formatDate(startDate)} – ${formatDate(endDate)}.`
          : null,
    );
    setCaptionError(trimmed.length > 255 ? "Najwyżej 255 znaków." : null);
    setFormError(null);
    if (day === "" || outside || trimmed.length > 255) return;

    setSaving(true);
    try {
      // Pusty podpis = usunięcie podpisu (null)
      const saved = await api.patch<Photo>(`/trips/${tripId}/photos/${photo.id}`, {
        day,
        caption: trimmed === "" ? null : trimmed,
      });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Nie udało się zapisać zdjęcia.");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={onBackdropClick}
      data-testid="photo-edit-dialog"
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <h2 id={`${id}-title`} className={styles.title}>
          Dzień i podpis zdjęcia
        </h2>
        <PhotoImage photo={photo} alt={photo.caption ?? "Edytowane zdjęcie"} className={styles.preview} />

        {formError && (
          <p className={styles.formError} role="alert" data-testid="photo-edit-error">
            {formError}
          </p>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor={`${id}-day`} className={styles.label}>
            Dzień
          </label>
          <input
            id={`${id}-day`}
            type="date"
            className={styles.field}
            value={day}
            min={startDate}
            max={endDate}
            onChange={(e) => setDay(e.target.value)}
            aria-invalid={dayError ? true : undefined}
            aria-describedby={dayError ? `${id}-day-error` : undefined}
            autoFocus
            data-testid="input-photo-day"
          />
          {dayError && (
            <p id={`${id}-day-error`} className={styles.fieldError} data-testid="error-photo-day">
              {dayError}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor={`${id}-caption`} className={styles.label}>
            Podpis (opcjonalnie)
          </label>
          <input
            id={`${id}-caption`}
            className={styles.field}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            aria-invalid={captionError ? true : undefined}
            aria-describedby={captionError ? `${id}-caption-error` : undefined}
            data-testid="input-photo-caption"
          />
          {captionError && (
            <p id={`${id}-caption-error`} className={styles.fieldError} data-testid="error-photo-caption">
              {captionError}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose} data-testid="btn-cancel-photo-edit">
            Anuluj
          </button>
          <button type="submit" className={styles.primary} disabled={saving} data-testid="btn-save-photo-edit">
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
