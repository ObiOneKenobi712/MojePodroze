import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Dictionaries } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate, formatPln, formatWeekday, tripDayNumber } from "../../utils/format";
import { useConfirm } from "../../hooks/useConfirm";
import styles from "./ItemSection.module.css";

export interface Option {
  value: string;
  label: string;
}

/** Jedno pole formularza pozycji kosztowej */
export interface FieldDef {
  /** Nazwa pola w API, np. "dish", "transport_mean_id" */
  name: string;
  label: string;
  /** text – tekst, textarea – dłuższy tekst (na całą szerokość), date – data, datetime – data z godziną,
      time – sama godzina, money – kwota PLN, rating – ocena 1–5 (opcjonalna), select – lista */
  kind: "text" | "textarea" | "date" | "datetime" | "time" | "money" | "rating" | "select";
  /** Końcówka data-testid pola: input-{testId sekcji}-{testKey}, np. input-meal-restaurant */
  testKey: string;
  required?: boolean;
  /** Komunikat, gdy brak wymaganej wartości */
  requiredMessage?: string;
  maxLength?: number;
  minLength?: number;
  /** Wysokość pola textarea w wierszach (domyślnie 3) */
  rows?: number;
  /** Data bez ograniczenia do terminu podróży (np. wydatek przed wyjazdem) */
  anyDate?: boolean;
  /** Lista wyboru ze słownika (GET /api/dictionaries) */
  options?: (dict: Dictionaries) => Option[];
  /** Lista wyboru zwraca liczbę (id ze słownika), a nie tekst */
  numeric?: boolean;
  /** Wartość pola z pozycji z API, gdy nazwa się różni (np. transport_mean.id → transport_mean_id) */
  fromItem?: (item: never) => string | number | null;
}

/** Pozycja z API: zawsze ma id; koszt tylko w sekcjach kosztowych */
type Item = { id: number; cost?: number };

/** Przepis na sekcję: ścieżka API, napisy, pola formularza i wygląd pozycji na liście */
export interface SectionConfig<T extends Item> {
  /** Ścieżka w API: /api/trips/{id}/{path} */
  path: string;
  title: string;
  /** data-testid: {plural}-section, {single}-form, btn-add-{single} … */
  testId: { single: string; plural: string };
  texts: {
    add: string; // „Dodaj posiłek”
    new: string; // „Nowy posiłek”
    edit: string; // „Edytuj posiłek”
    remove: string; // „Usuń posiłek”
    removeTitle: string; // „Usunąć posiłek?”
    empty: string;
    loading: string;
    loadError: string;
    saveError: string;
    removeError: string;
  };
  fields: FieldDef[];
  /** Reguły obejmujące kilka pól albo inne pozycje (np. przylot nie wcześniej niż wylot, jeden nocleg na noc)
      – błędy przy polach; `editingId` = id edytowanej pozycji (pomijana przy porównaniu), null przy dodawaniu */
  validate?: (values: Record<string, string>, items: T[], editingId: number | null) => Record<string, string>;
  /** Zmiana wartości przy „Kopiuj” (np. nocleg → następny dzień) */
  copyValues?: (values: Record<string, string>) => Record<string, string>;
  /** Zakres w kalendarzu zależny od innych pól (np. przylot: od wylotu do wylotu + 48 h) */
  limits?: (values: Record<string, string>) => Record<string, { min?: string; max?: string }>;
  /** Pierwsza linia pozycji (pogrubiona); pusty tekst = bez tytułu */
  itemTitle: (item: T) => string;
  /** Druga linia: części rozdzielone „·” (pusta lista = bez tej linii) */
  itemMeta: (item: T) => string[];
  itemRating?: (item: T) => number | null;
  /** Dodatkowy opis pod pozycją, np. notatka */
  itemNote?: (item: T) => string | null;
  /** Opis to główna treść (np. wpis pamiętnika) – zwykły tekst zamiast małego szarego */
  noteIsBody?: boolean;
  /** Opis pozycji w oknie usuwania, np. „Pierogi” (Bar Mleczny, 12.11.2026) */
  removeMessage: (item: T) => string;
  /** Lista pogrupowana według dni (np. plan dnia): dzień pozycji RRRR-MM-DD */
  groupByDay?: (item: T) => string;
}

type Values = Record<string, string>;
type Errors = Record<string, string>;

type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; items: T[]; dict: Dictionaries | null }
  | { status: "error"; message: string };

/** Formularz: zamknięty, nowa pozycja (pusta albo kopia `from`), edycja `item` */
type FormMode<T> = { kind: "closed" } | { kind: "add"; from?: T } | { kind: "edit"; item: T };

// Kwota jak w backendzie: liczba ≥ 0, najwyżej 2 miejsca po przecinku (przecinek albo kropka)
const COST_PATTERN = /^\d{1,10}([.,]\d{1,2})?$/;

/** Zakres kalendarza = termin podróży (data albo data z godziną) */
function tripRange(field: FieldDef, startDate: string, endDate: string): { min?: string; max?: string } {
  if (field.anyDate) return {};
  if (field.kind === "date") return { min: startDate, max: endDate };
  if (field.kind === "datetime") return { min: `${startDate}T00:00`, max: `${endDate}T23:59` };
  return {};
}

// Te same zasady co w backendzie (backend/app/schemas/items.py) – tu, żeby pokazać błąd po polsku przy polu.
// Dodatkowo daty w terminie podróży (backend tego nie sprawdza – to pomoc przy wpisywaniu).
function validate(fields: FieldDef[], values: Values, startDate: string, endDate: string): Errors {
  const errors: Errors = {};
  for (const field of fields) {
    const value = values[field.name].trim();
    if (field.kind === "money") {
      if (!COST_PATTERN.test(value)) errors[field.name] = "Podaj kwotę, np. 45 albo 45,50.";
    } else if (field.required && value === "") {
      errors[field.name] = field.requiredMessage ?? "To pole jest wymagane.";
    } else if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `Najwyżej ${field.maxLength} znaków.`;
    } else if (field.minLength && value !== "" && value.length < field.minLength) {
      errors[field.name] = `Co najmniej ${field.minLength} znaki.`;
    } else if (value !== "") {
      const { min, max } = tripRange(field, startDate, endDate);
      if ((min && value < min) || (max && value > max))
        errors[field.name] = `Wybierz datę w terminie podróży: ${formatDate(startDate)} – ${formatDate(endDate)}.`;
    }
  }
  return errors;
}

/** Wartości formularza → dane do API */
function toInput(fields: FieldDef[], values: Values): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name].trim();
    if (field.kind === "money") input[field.name] = Number(value.replace(",", "."));
    else if (value === "") input[field.name] = null;
    else if (field.kind === "rating" || field.numeric) input[field.name] = Number(value);
    else input[field.name] = value;
  }
  return input;
}

/** Pozycja z API → wartości formularza (edycja) */
function toValues(fields: FieldDef[], item: Record<string, unknown>): Values {
  const values: Values = {};
  for (const field of fields) {
    const raw = field.fromItem ? field.fromItem(item as never) : item[field.name];
    const text = raw === null || raw === undefined ? "" : String(raw);
    // money: przecinek po polsku; datetime/time: pole przyjmuje "RRRR-MM-DDTGG:MM" / "GG:MM" (bez sekund z API)
    values[field.name] =
      field.kind === "money"
        ? text.replace(".", ",")
        : field.kind === "datetime"
          ? text.slice(0, 16)
          : field.kind === "time"
            ? text.slice(0, 5)
            : text;
  }
  return values;
}

/** Pusty formularz: data = pierwszy dzień podróży, lista wyboru = pierwsza opcja */
function emptyValues(fields: FieldDef[], defaultDate: string, dict: Dictionaries | null): Values {
  const values: Values = {};
  for (const field of fields) {
    if (field.kind === "date" && field.required) values[field.name] = defaultDate;
    else if (field.kind === "select" && field.required && dict && field.options)
      values[field.name] = field.options(dict)[0]?.value ?? "";
    else values[field.name] = "";
  }
  return values;
}

/** Pozycje po kolei pogrupowane według dnia (backend zwraca je już posortowane) */
function groupItems<T>(items: T[], dayOf: (item: T) => string): [string, T[]][] {
  const groups: [string, T[]][] = [];
  for (const item of items) {
    const day = dayOf(item);
    const last = groups[groups.length - 1];
    if (last && last[0] === day) last[1].push(item);
    else groups.push([day, [item]]);
  }
  return groups;
}

/** Ocena jako gwiazdki (dekoracja) + napis dla czytników ekranu */
function Rating({ value }: { value: number | null }) {
  if (value === null) return <span className={styles.muted}>bez oceny</span>;
  return (
    <span className={styles.rating}>
      <span aria-hidden="true">{"★".repeat(value) + "☆".repeat(5 - value)}</span>
      <span className="visually-hidden">ocena {value} na 5</span>
    </span>
  );
}

interface Props<T extends Item> {
  config: SectionConfig<T>;
  tripId: number;
  /** Archiwum: lista bez formularza i przycisków */
  readOnly: boolean;
  /** Termin podróży: zakres kalendarzy; pierwszy dzień = domyślna data nowej pozycji */
  startDate: string;
  endDate: string;
}

// Sekcja pozycji podróży (loty, posiłki, …, plan dnia): lista z GET /api/trips/{id}/{path}, dodawanie (POST),
// edycja (PUT), usuwanie (DELETE). Co pokazać i jakie pola – z przepisu `config`.
export default function ItemSection<T extends Item>({
  config,
  tripId,
  readOnly,
  startDate,
  endDate,
}: Props<T>) {
  const defaultDate = startDate;
  const { fields, texts, testId } = config;
  const needsDict = fields.some((f) => f.options);
  // Sekcja kosztowa: suma „Razem” i wzmianka o kosztorysie przy usuwaniu
  const hasCost = fields.some((f) => f.kind === "money");
  const [load, setLoad] = useState<LoadState<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<FormMode<T>>({ kind: "closed" });
  const [values, setValues] = useState<Values>(() => emptyValues(fields, defaultDate, null));
  const [fieldErrors, setFieldErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const idPrefix = useId();
  const { confirm, confirmDialog } = useConfirm();
  const listPath = `/trips/${tripId}/${config.path}`;
  const formRef = useRef<HTMLFormElement>(null);

  // Po otwarciu formularza (dodaj, kopiuj, edytuj) fokus na pierwsze pole – przeglądarka przewinie
  // do formularza, który jest nad listą
  useEffect(() => {
    if (mode.kind !== "closed") formRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<T[]>(listPath),
      needsDict ? api.get<Dictionaries>("/dictionaries") : Promise.resolve(null),
    ])
      .then(([items, dict]) => {
        if (!cancelled) setLoad({ status: "ready", items, dict });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoad({ status: "error", message: error instanceof ApiError ? error.message : texts.loadError });
      });
    return () => {
      cancelled = true;
    };
  }, [listPath, needsDict, texts.loadError, reloadKey]);

  const dict = load.status === "ready" ? load.dict : null;

  function set(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function openForm(next: FormMode<T>) {
    setMode(next);
    if (next.kind === "edit") setValues(toValues(fields, next.item as unknown as Record<string, unknown>));
    else if (next.kind === "add" && next.from) {
      const copied = toValues(fields, next.from as unknown as Record<string, unknown>);
      setValues(config.copyValues ? config.copyValues(copied) : copied);
    } else setValues(emptyValues(fields, defaultDate, dict));
    setFieldErrors({});
    setFormError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const items = load.status === "ready" ? load.items : [];
    const editingId = mode.kind === "edit" ? mode.item.id : null;
    const errors = {
      ...config.validate?.(values, items, editingId),
      ...validate(fields, values, startDate, endDate),
    };
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      setFormError("Popraw zaznaczone pola.");
      return;
    }

    setSaving(true);
    try {
      if (mode.kind === "edit") await api.put<T>(`${listPath}/${mode.item.id}`, toInput(fields, values));
      else await api.post<T>(listPath, toInput(fields, values));
      // Lista od nowa z backendu – zachowuje jego sortowanie (po dacie)
      const items = await api.get<T[]>(listPath);
      setLoad({ status: "ready", items, dict });
      setMode({ kind: "closed" });
    } catch (error) {
      if (error instanceof ApiError && error.errors.length > 0) {
        const serverErrors: Errors = {};
        for (const e of error.errors) serverErrors[e.field] = "Nieprawidłowa wartość.";
        setFieldErrors(serverErrors);
      }
      setFormError(error instanceof ApiError ? error.message : texts.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: T) {
    const confirmed = await confirm({
      title: texts.removeTitle,
      message: `${config.removeMessage(item)} zniknie z listy${hasCost ? " i z kosztorysu" : ""}.`,
      confirmLabel: texts.remove,
    });
    if (!confirmed) return;
    setDeletingId(item.id);
    setDeleteError(null);
    try {
      await api.delete(`${listPath}/${item.id}`);
      setLoad((l) => (l.status === "ready" ? { ...l, items: l.items.filter((i) => i.id !== item.id) } : l));
      if (mode.kind === "edit" && mode.item.id === item.id) setMode({ kind: "closed" });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : texts.removeError);
    } finally {
      setDeletingId(null);
    }
  }

  function renderField(field: FieldDef) {
    const id = `${idPrefix}-${field.name}`;
    const error = fieldErrors[field.name];
    const isSelect = field.kind === "select" || field.kind === "rating";
    const common = {
      id,
      className: styles.field,
      value: values[field.name],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      "data-testid": `${isSelect ? "select" : "input"}-${testId.single}-${field.testKey}`,
    };
    return (
      <div
        key={field.name}
        className={field.kind === "textarea" ? `${styles.fieldGroup} ${styles.wide}` : styles.fieldGroup}
      >
        <label htmlFor={id} className={styles.label}>
          {field.label}
        </label>
        {field.kind === "rating" ? (
          <select {...common} onChange={(e) => set(field.name, e.target.value)}>
            <option value="">bez oceny</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        ) : field.kind === "select" ? (
          <select {...common} onChange={(e) => set(field.name, e.target.value)}>
            {!field.required && <option value="">—</option>}
            {dict &&
              field.options?.(dict).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </select>
        ) : field.kind === "textarea" ? (
          <textarea
            {...common}
            className={`${styles.field} ${styles.textarea}`}
            rows={field.rows ?? 3}
            onChange={(e) => set(field.name, e.target.value)}
          />
        ) : (
          <input
            {...common}
            type={
              field.kind === "date"
                ? "date"
                : field.kind === "datetime"
                  ? "datetime-local"
                  : field.kind === "time"
                    ? "time"
                    : "text"
            }
            // Kalendarz otwiera się na terminie podróży, dni spoza niego są wyszarzone
            {...tripRange(field, startDate, endDate)}
            {...config.limits?.(values)[field.name]}
            inputMode={field.kind === "money" ? "decimal" : undefined}
            onChange={(e) => set(field.name, e.target.value)}
          />
        )}
        {error && (
          <p
            id={`${id}-error`}
            className={styles.fieldError}
            data-testid={`error-${testId.single}-${field.name.replaceAll("_", "-")}`}
          >
            {error}
          </p>
        )}
      </div>
    );
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
  const total = items.reduce((sum, i) => sum + (i.cost ?? 0), 0);

  function renderItem(item: T) {
    const title = config.itemTitle(item);
    const meta = config.itemMeta(item);
    // Nazwa pozycji dla przycisków (czytniki ekranu) – gdy brak tytułu (np. wpis pamiętnika), opis z okna usuwania
    const label = title || config.removeMessage(item);
    return (
      <li key={item.id} className={styles.item} data-testid={`${testId.single}-${item.id}`}>
        <div className={styles.itemText}>
          {title && <p className={styles.itemTitle}>{title}</p>}
          {meta.length > 0 && (
            <p className={styles.itemMeta}>
              {meta.map((part, index) => (
                <span key={index}>
                  {index > 0 && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="visually-hidden">, </span>
                    </>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}
          {config.itemRating && <Rating value={config.itemRating(item)} />}
          {config.itemNote?.(item) && (
            <p className={config.noteIsBody ? styles.itemBody : styles.itemNote}>{config.itemNote(item)}</p>
          )}
        </div>
        {hasCost && <p className={styles.cost}>{formatPln(item.cost ?? 0)}</p>}
        {!readOnly && (
          <div className={styles.itemActions}>
            <button
              type="button"
              className={styles.small}
              onClick={() => openForm({ kind: "edit", item })}
              aria-label={`${texts.edit}: ${label}`}
              data-testid={`btn-edit-${testId.single}-${item.id}`}
            >
              Edytuj
            </button>
            {/* Kopia: formularz nowej pozycji z tymi samymi danymi – zapis dopiero po „Dodaj” */}
            <button
              type="button"
              className={styles.small}
              onClick={() => openForm({ kind: "add", from: item })}
              aria-label={`Kopiuj: ${label}`}
              data-testid={`btn-copy-${testId.single}-${item.id}`}
            >
              Kopiuj
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={() => deleteItem(item)}
              disabled={deletingId === item.id}
              aria-label={`${texts.remove}: ${label}`}
              data-testid={`btn-delete-${testId.single}-${item.id}`}
            >
              Usuń
            </button>
          </div>
        )}
      </li>
    );
  }


  return (
    <section
      className={styles.section}
      aria-labelledby={`${idPrefix}-title`}
      data-testid={`${testId.plural}-section`}
    >
      <div className={styles.head}>
        <h2 id={`${idPrefix}-title`} className={styles.title}>
          {config.title}
        </h2>
        {!readOnly && mode.kind === "closed" && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => openForm({ kind: "add" })}
            data-testid={`btn-add-${testId.single}`}
          >
            {texts.add}
          </button>
        )}
      </div>

      {!readOnly && mode.kind !== "closed" && (
        <form
          ref={formRef}
          className={styles.form}
          onSubmit={onSubmit}
          noValidate
          data-testid={`${testId.single}-form`}
        >
          <h3 className={styles.formTitle}>{mode.kind === "edit" ? texts.edit : texts.new}</h3>
          {formError && (
            <p className={styles.error} role="alert" data-testid={`${testId.single}-form-error`}>
              {formError}
            </p>
          )}
          <div className={styles.grid}>{fields.map(renderField)}</div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setMode({ kind: "closed" })}
              data-testid={`btn-cancel-${testId.single}`}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={saving}
              data-testid={`btn-save-${testId.single}`}
            >
              {saving ? "Zapisywanie…" : mode.kind === "edit" ? "Zapisz zmiany" : "Dodaj"}
            </button>
          </div>
        </form>
      )}

      {deleteError && (
        <p className={styles.error} role="alert" data-testid={`${testId.single}-delete-error`}>
          {deleteError}
        </p>
      )}

      {items.length === 0 ? (
        <p className={styles.muted} data-testid={`${testId.plural}-empty`}>
          {texts.empty}
        </p>
      ) : (
        <>
          {config.groupByDay ? (
            // Plan dnia: nagłówek „Dzień N · poniedziałek, 21.09.2026”, pod nim pozycje tego dnia
            groupItems(items, config.groupByDay).map(([day, dayItems]) => {
              const n = tripDayNumber(day, startDate, endDate);
              return (
                <section key={day} className={styles.day} data-testid={`${testId.single}-day-${day}`}>
                  <h3 className={styles.dayTitle}>
                    {n !== null && <>Dzień {n} · </>}
                    {formatWeekday(day)}, {formatDate(day)}
                  </h3>
                  <ul className={styles.list}>{dayItems.map(renderItem)}</ul>
                </section>
              );
            })
          ) : (
            <ul className={styles.list} data-testid={`${testId.single}-list`}>
              {items.map(renderItem)}
            </ul>
          )}
          {hasCost && (
            <p className={styles.total}>
              Razem: <strong data-testid={`${testId.plural}-total`}>{formatPln(total)}</strong>
            </p>
          )}
        </>
      )}
      {confirmDialog}
    </section>
  );
}
