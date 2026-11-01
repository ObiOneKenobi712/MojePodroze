import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "../../api/client";
import { useConfirm } from "../../hooks/useConfirm";
import styles from "./ChecklistSection.module.css";

/** Pozycja listy z API: nazwa, znacznik odhaczenia (visited / packed), opcjonalnie notatka i „domyślna” */
export interface ChecklistItem {
  id: number;
  name: string;
  note?: string | null;
  is_default?: boolean;
  visited?: boolean;
  packed?: boolean;
}

/** Przepis na listę do odhaczania */
export interface ChecklistConfig {
  /** Ścieżka w API: /api/trips/{id}/{path} */
  path: string;
  title: string;
  /** Pole odhaczenia w API */
  checkKey: "visited" | "packed";
  /** Czy pozycja ma notatkę (Chcę odwiedzić – tak, pakowanie – nie) */
  hasNote: boolean;
  /** data-testid: {plural}-section, {single}-{id}, checkbox-{single}-{id} … */
  testId: { single: string; plural: string };
  texts: {
    nameLabel: string; // „Miejsce”, „Rzecz do spakowania”
    add: string; // „Dodaj”
    empty: string;
    progress: (done: number, total: number) => string; // „Spakowano 3 z 10”
    loading: string;
    loadError: string;
    removeTitle: string;
    remove: string;
  };
}

const NAME_MAX = 150;
const NOTE_MAX = 2000;

type LoadState =
  | { status: "loading" }
  | { status: "ready"; items: ChecklistItem[] }
  | { status: "error"; message: string };

/** Walidacja jak w backendzie (Name, Note w backend/app/schemas/common.py) */
function validateName(name: string): string | null {
  if (name.trim() === "") return "Podaj nazwę.";
  if (name.trim().length > NAME_MAX) return `Najwyżej ${NAME_MAX} znaków.`;
  return null;
}

interface Props {
  config: ChecklistConfig;
  tripId: number;
  /** Archiwum: bez dodawania, edycji i odhaczania */
  readOnly: boolean;
}

// Lista do odhaczania (Chcę odwiedzić, pakowanie): GET lista, POST dodaj, PATCH odhacz / zmień, DELETE usuń.
// Odhaczenie zapisuje się od razu po kliknięciu – bez formularza.
export default function ChecklistSection({ config, tripId, readOnly }: Props) {
  const { texts, testId, checkKey } = config;
  const listPath = `/trips/${tripId}/${config.path}`;
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; note: string } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const idPrefix = useId();
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    let cancelled = false;
    api
      .get<ChecklistItem[]>(listPath)
      .then((items) => {
        if (!cancelled) setLoad({ status: "ready", items });
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: e instanceof ApiError ? e.message : texts.loadError });
      });
    return () => {
      cancelled = true;
    };
  }, [listPath, texts.loadError, reloadKey]);

  // Po wejściu w edycję – fokus na polu nazwy
  const editingId = editing?.id;
  useEffect(() => {
    if (editingId !== undefined) editRef.current?.focus();
  }, [editingId]);

  function replaceItem(item: ChecklistItem) {
    setLoad((l) => (l.status === "ready" ? { ...l, items: l.items.map((i) => (i.id === item.id ? item : i)) } : l));
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const problem = validateName(name) ?? (note.trim().length > NOTE_MAX ? `Notatka: najwyżej ${NOTE_MAX} znaków.` : null);
    setAddError(problem);
    if (problem) return;
    setAdding(true);
    try {
      const body = config.hasNote ? { name: name.trim(), note: note.trim() || null } : { name: name.trim() };
      const created = await api.post<ChecklistItem>(listPath, body);
      // Nowa pozycja na końcu nieodhaczonych (tak samo ułoży ją backend po odświeżeniu)
      setLoad((l) => {
        if (l.status !== "ready") return l;
        const firstDone = l.items.findIndex((i) => i[checkKey]);
        const at = firstDone === -1 ? l.items.length : firstDone;
        return { ...l, items: [...l.items.slice(0, at), created, ...l.items.slice(at)] };
      });
      setName("");
      setNote("");
      nameRef.current?.focus(); // od razu można wpisać kolejną pozycję
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : "Nie udało się dodać.");
    } finally {
      setAdding(false);
    }
  }

  // Odhaczenie: od razu na ekranie, potem zapis; przy błędzie wracamy do poprzedniego stanu.
  // Pozycja zostaje na miejscu (bez przeskakiwania pod kursorem) – kolejność z backendu po ponownym wejściu.
  async function toggle(item: ChecklistItem, checked: boolean) {
    setError(null);
    replaceItem({ ...item, [checkKey]: checked });
    try {
      replaceItem(await api.patch<ChecklistItem>(`${listPath}/${item.id}`, { [checkKey]: checked }));
    } catch (e) {
      replaceItem(item);
      setError(e instanceof ApiError ? e.message : "Nie udało się zapisać zmiany.");
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const problem =
      validateName(editing.name) ??
      (editing.note.trim().length > NOTE_MAX ? `Notatka: najwyżej ${NOTE_MAX} znaków.` : null);
    setEditError(problem);
    if (problem) return;
    try {
      const body = config.hasNote
        ? { name: editing.name.trim(), note: editing.note.trim() || null }
        : { name: editing.name.trim() };
      replaceItem(await api.patch<ChecklistItem>(`${listPath}/${editing.id}`, body));
      setEditing(null);
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "Nie udało się zapisać zmiany.");
    }
  }

  async function remove(item: ChecklistItem) {
    const confirmed = await confirm({
      title: texts.removeTitle,
      message: `„${item.name}” zniknie z listy.`,
      confirmLabel: texts.remove,
    });
    if (!confirmed) return;
    setError(null);
    try {
      await api.delete(`${listPath}/${item.id}`);
      setLoad((l) => (l.status === "ready" ? { ...l, items: l.items.filter((i) => i.id !== item.id) } : l));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Nie udało się usunąć.");
    }
  }

  if (load.status === "loading") {
    return (
      <p className={styles.muted} role="status" data-testid={`${testId.plural}-loading`}>
        {texts.loading}
      </p>
    );
  }

  if (load.status === "error") {
    return (
      <div className={styles.error} role="alert" data-testid={`${testId.plural}-error`}>
        <p>{load.message}</p>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            setLoad({ status: "loading" });
            setReloadKey((k) => k + 1);
          }}
          data-testid={`${testId.plural}-retry`}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const items = load.items;
  const done = items.filter((i) => i[checkKey]).length;

  return (
    <section className={styles.section} aria-labelledby={`${idPrefix}-title`} data-testid={`${testId.plural}-section`}>
      <div className={styles.head}>
        <h2 id={`${idPrefix}-title`} className={styles.title}>
          {config.title}
        </h2>
        {items.length > 0 && (
          <div className={styles.progress}>
            <p data-testid={`${testId.plural}-progress`}>{texts.progress(done, items.length)}</p>
            {/* Pasek tylko dla oka – liczby są w tekście obok */}
            <span className={styles.bar} aria-hidden="true">
              <span style={{ width: `${(done / items.length) * 100}%` }} />
            </span>
          </div>
        )}
      </div>

      {!readOnly && (
        <form className={styles.addForm} onSubmit={add} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor={`${idPrefix}-name`} className={styles.label}>
              {texts.nameLabel}
            </label>
            <input
              ref={nameRef}
              id={`${idPrefix}-name`}
              className={styles.field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={addError ? true : undefined}
              aria-describedby={addError ? `${idPrefix}-add-error` : undefined}
              data-testid={`input-${testId.single}-name`}
            />
          </div>
          {config.hasNote && (
            <div className={styles.fieldGroup}>
              <label htmlFor={`${idPrefix}-note`} className={styles.label}>
                Notatka (opcjonalnie)
              </label>
              <input
                id={`${idPrefix}-note`}
                className={styles.field}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                data-testid={`input-${testId.single}-note`}
              />
            </div>
          )}
          <button type="submit" className={styles.primary} disabled={adding} data-testid={`btn-add-${testId.single}`}>
            {texts.add}
          </button>
          {addError && (
            <p id={`${idPrefix}-add-error`} className={styles.fieldError} data-testid={`${testId.single}-add-error`}>
              {addError}
            </p>
          )}
        </form>
      )}

      {error && (
        <p className={styles.error} role="alert" data-testid={`${testId.single}-error`}>
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className={styles.muted} data-testid={`${testId.plural}-empty`}>
          {texts.empty}
        </p>
      ) : (
        <ul className={styles.list} data-testid={`${testId.single}-list`}>
          {items.map((item) => {
            const checked = Boolean(item[checkKey]);
            const isEditing = editing?.id === item.id;
            return (
              <li
                key={item.id}
                className={checked ? `${styles.item} ${styles.done}` : styles.item}
                data-testid={`${testId.single}-${item.id}`}
              >
                {isEditing && editing ? (
                  <form className={styles.editForm} onSubmit={saveEdit} noValidate>
                    <label htmlFor={`${idPrefix}-edit-name`} className="visually-hidden">
                      Nazwa
                    </label>
                    <input
                      ref={editRef}
                      id={`${idPrefix}-edit-name`}
                      className={styles.field}
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                      aria-invalid={editError ? true : undefined}
                      aria-describedby={editError ? `${idPrefix}-edit-error` : undefined}
                      data-testid={`input-edit-${testId.single}-name`}
                    />
                    {config.hasNote && (
                      <>
                        <label htmlFor={`${idPrefix}-edit-note`} className="visually-hidden">
                          Notatka
                        </label>
                        <input
                          id={`${idPrefix}-edit-note`}
                          className={styles.field}
                          value={editing.note}
                          placeholder="Notatka (opcjonalnie)"
                          onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                          data-testid={`input-edit-${testId.single}-note`}
                        />
                      </>
                    )}
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.small}
                        onClick={() => setEditing(null)}
                        data-testid={`btn-cancel-${testId.single}-${item.id}`}
                      >
                        Anuluj
                      </button>
                      <button type="submit" className={styles.smallPrimary} data-testid={`btn-save-${testId.single}-${item.id}`}>
                        Zapisz
                      </button>
                    </div>
                    {editError && (
                      <p id={`${idPrefix}-edit-error`} className={styles.fieldError}>
                        {editError}
                      </p>
                    )}
                  </form>
                ) : (
                  <>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={(e) => toggle(item, e.target.checked)}
                        data-testid={`checkbox-${testId.single}-${item.id}`}
                      />
                      <span className={styles.itemText}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.note && <span className={styles.itemNote}>{item.note}</span>}
                      </span>
                    </label>
                    {item.is_default && <span className={styles.badge}>z listy domyślnej</span>}
                    {!readOnly && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.small}
                          onClick={() => {
                            setEditError(null);
                            setEditing({ id: item.id, name: item.name, note: item.note ?? "" });
                          }}
                          aria-label={`Edytuj: ${item.name}`}
                          data-testid={`btn-edit-${testId.single}-${item.id}`}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className={styles.danger}
                          onClick={() => remove(item)}
                          aria-label={`Usuń: ${item.name}`}
                          data-testid={`btn-delete-${testId.single}-${item.id}`}
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {confirmDialog}
    </section>
  );
}
