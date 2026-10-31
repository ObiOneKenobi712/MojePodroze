import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Photo } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate } from "../../utils/format";
import TripCover from "../../components/TripCard/TripCover";
import TripPhotos from "../../components/TripPhotos/TripPhotos";
import styles from "./TripFormPage.module.css";

// Zdjęcie jak w backendzie: JPG, PNG, GIF, WEBP, domyślnie maks. 10 MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 20;

function validatePhoto(file: File): string | undefined {
  if (!PHOTO_TYPES.includes(file.type)) return "nieobsługiwany format (tylko JPG, PNG, GIF, WEBP)";
  if (file.size > PHOTO_MAX_BYTES) return "plik większy niż 10 MB";
  return undefined;
}

/** 1 zdjęcie, 2–4 zdjęcia, 5+ zdjęć (12–14 zdjęć) */
function photosLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (count === 1) return "1 zdjęcie";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} zdjęcia`;
  return `${count} zdjęć`;
}

interface Item {
  key: string;
  file: File;
  url: string; // podgląd (URL.createObjectURL)
  error?: string; // błąd wysyłania z API
}

interface Props {
  tripId: number;
  /** Termin podróży: domyślny dzień nowych zdjęć = pierwszy dzień, wybór tylko w terminie */
  startDate: string;
  endDate: string;
}

// Dodawanie zdjęć w edycji podróży: kilka plików naraz, wysyłanych po kolei
// (POST /api/trips/{id}/photos przyjmuje jeden plik), od razu, niezależnie od formularza.
export default function PhotoUpload({ tripId, startDate, endDate }: Props) {
  const id = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [coverKey, setCoverKey] = useState(0);
  // Dzień albumu dla wybranej paczki zdjęć
  const [day, setDay] = useState(startDate);
  const [dayError, setDayError] = useState<string | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Zwolnij podglądy z pamięci przy wyjściu z formularza
  useEffect(
    () => () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.url);
    },
    [],
  );

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = ""; // pozwala wybrać te same pliki ponownie
    const accepted: Item[] = [];
    const problems: string[] = [];
    const free = MAX_FILES - items.length;
    for (const file of picked) {
      const problem = validatePhoto(file);
      if (problem) problems.push(`${file.name}: ${problem}`);
      else if (accepted.length >= free) problems.push(`${file.name}: można dodać najwyżej ${MAX_FILES} zdjęć naraz`);
      else accepted.push({ key: `${file.name}-${file.size}-${crypto.randomUUID()}`, file, url: URL.createObjectURL(file) });
    }
    setRejected(problems);
    setResult(null);
    setItems((current) => [...current, ...accepted]);
  }

  function remove(key: string) {
    setItems((current) => {
      const item = current.find((i) => i.key === key);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((i) => i.key !== key);
    });
  }

  async function uploadAll() {
    if (day === "" || day < startDate || day > endDate) {
      setDayError(`Wybierz dzień w terminie podróży: ${formatDate(startDate)} – ${formatDate(endDate)}.`);
      return;
    }
    setDayError(null);
    const queue = items;
    setResult(null);
    setRejected([]);
    setProgress({ done: 0, total: queue.length });
    let uploaded = 0;
    for (const [index, item] of queue.entries()) {
      const form = new FormData();
      form.append("file", item.file);
      form.append("day", day);
      try {
        await api.upload<Photo>(`/trips/${tripId}/photos`, form);
        uploaded += 1;
        remove(item.key);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Nie udało się wysłać.";
        setItems((current) => current.map((i) => (i.key === item.key ? { ...i, error: message } : i)));
      }
      setProgress({ done: index + 1, total: queue.length });
    }
    setProgress(null);
    const failed = queue.length - uploaded;
    setResult(
      failed === 0
        ? `Dodano ${photosLabel(uploaded)}.`
        : `Dodano ${photosLabel(uploaded)}, nie udało się wysłać: ${failed}. Spróbuj ponownie albo usuń je z listy.`,
    );
    if (uploaded > 0) setCoverKey((k) => k + 1); // odśwież okładkę
  }

  const uploading = progress !== null;

  return (
    <section className={styles.photos} aria-labelledby={`${id}-heading`} data-testid="trip-photos">
      <h2 id={`${id}-heading`} className={styles.subtitle}>
        Zdjęcia
      </h2>
      <TripCover key={coverKey} tripId={tripId} className={styles.photoCover} />
      <p className={styles.hint}>Na okładce i na karcie podróży pokazuje się pierwsze zdjęcie z listy poniżej.</p>
      <TripPhotos
        tripId={tripId}
        refreshKey={coverKey}
        editable
        onChange={() => setCoverKey((k) => k + 1)}
        startDate={startDate}
        endDate={endDate}
      />

      <div className={styles.fieldGroup}>
        <label htmlFor={id} className={styles.label}>
          Dodaj zdjęcia
        </label>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={PHOTO_TYPES.join(",")}
          className={styles.fileInput}
          onChange={onChange}
          disabled={uploading}
          aria-describedby={rejected.length > 0 ? `${id}-hint ${id}-error` : `${id}-hint`}
          data-testid="input-trip-photo"
        />
        <p id={`${id}-hint`} className={styles.hint}>
          Możesz wybrać kilka plików naraz (najwyżej {MAX_FILES}). JPG, PNG, GIF albo WEBP, każdy do 10 MB.
        </p>
        {rejected.length > 0 && (
          <div id={`${id}-error`} className={styles.fieldError} role="alert" data-testid="error-photo">
            <p>Pominięto:</p>
            <ul className={styles.rejectedList}>
              {rejected.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          <ul className={styles.previewGrid} aria-label="Wybrane zdjęcia" data-testid="trip-photo-previews">
            {items.map((item, index) => (
              <li key={item.key} className={styles.previewItem} data-testid={`trip-photo-preview-${index}`}>
                <img src={item.url} alt={`Podgląd: ${item.file.name}`} />
                <span className={styles.previewName}>{item.file.name}</span>
                {item.error && <span className={styles.fieldError}>{item.error}</span>}
                <button
                  type="button"
                  className={styles.removePreview}
                  onClick={() => remove(item.key)}
                  disabled={uploading}
                  aria-label={`Usuń z listy: ${item.file.name}`}
                  data-testid={`btn-remove-photo-${index}`}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.fieldGroup}>
            <label htmlFor={`${id}-day`} className={styles.label}>
              Dzień zdjęć
            </label>
            <input
              id={`${id}-day`}
              type="date"
              className={styles.field}
              value={day}
              min={startDate}
              max={endDate}
              onChange={(e) => setDay(e.target.value)}
              disabled={uploading}
              aria-invalid={dayError ? true : undefined}
              aria-describedby={dayError ? `${id}-day-hint ${id}-day-error` : `${id}-day-hint`}
              data-testid="input-upload-day"
            />
            <p id={`${id}-day-hint`} className={styles.hint}>
              Wybrane zdjęcia trafią do tego dnia albumu. Dzień pojedynczego zdjęcia zmienisz ołówkiem przy zdjęciu.
            </p>
            {dayError && (
              <p id={`${id}-day-error`} className={styles.fieldError} data-testid="error-upload-day">
                {dayError}
              </p>
            )}
          </div>
          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.primary}
              onClick={uploadAll}
              disabled={uploading}
              data-testid="btn-upload-photo"
            >
              {progress
                ? `Wysyłanie ${Math.min(progress.done + 1, progress.total)} z ${progress.total}…`
                : `Wgraj ${photosLabel(items.length)}`}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                for (const item of items) URL.revokeObjectURL(item.url);
                setItems([]);
              }}
              disabled={uploading}
              data-testid="btn-clear-photos"
            >
              Wyczyść listę
            </button>
          </div>
        </>
      )}

      {/* Postęp i wynik dla czytników ekranu */}
      <p className="visually-hidden" aria-live="polite">
        {progress ? `Wysłano ${progress.done} z ${progress.total}.` : ""}
      </p>
      {result && (
        <p className={styles.success} role="status" data-testid="photo-uploaded">
          {result}
        </p>
      )}
    </section>
  );
}
