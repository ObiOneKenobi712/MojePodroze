import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Dictionaries, Trip, TripInput, TripType } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { capitalize } from "../../utils/format";
import { useConfirm } from "../../hooks/useConfirm";
import PhotoUpload from "./PhotoUpload";
import styles from "./TripFormPage.module.css";

type FieldName =
  | "name"
  | "destination_city"
  | "destination_country"
  | "start_date"
  | "end_date"
  | "planned_budget"
  | "trip_type"
  | "character_id";

type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  name: string;
  destination_city: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  planned_budget: string;
  trip_type: TripType;
  character_id: string;
}

type DictState =
  | { status: "loading" }
  | { status: "ready"; data: Dictionaries; trip: Trip | null }
  | { status: "error"; message: string };

// Budżet jak w backendzie: liczba > 0, najwyżej 2 miejsca po przecinku (przecinek albo kropka)
const BUDGET_PATTERN = /^\d{1,10}([.,]\d{1,2})?$/;

// Te same zasady co w backendzie (backend/app/schemas/trips.py) – tu, żeby pokazać błąd po polsku przy polu.
function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const required = (field: FieldName, value: string, message: string, max: number) => {
    if (value.trim() === "") errors[field] = message;
    else if (value.trim().length > max) errors[field] = `Najwyżej ${max} znaków.`;
  };
  required("name", values.name, "Podaj nazwę podróży.", 120);
  required("destination_city", values.destination_city, "Podaj miasto.", 100);
  required("destination_country", values.destination_country, "Podaj kraj.", 100);

  if (values.start_date === "") errors.start_date = "Podaj datę rozpoczęcia.";
  if (values.end_date === "") errors.end_date = "Podaj datę zakończenia.";
  else if (values.start_date !== "" && values.end_date < values.start_date)
    errors.end_date = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.";

  const budget = values.planned_budget.trim();
  if (budget !== "" && (!BUDGET_PATTERN.test(budget) || Number(budget.replace(",", ".")) <= 0))
    errors.planned_budget = "Podaj kwotę większą od zera, np. 2500 albo 2500,50.";

  if (values.character_id === "") errors.character_id = "Wybierz charakter podróży.";
  return errors;
}

function toInput(values: FormValues): TripInput {
  const budget = values.planned_budget.trim();
  return {
    name: values.name.trim(),
    destination_city: values.destination_city.trim(),
    destination_country: values.destination_country.trim(),
    start_date: values.start_date,
    end_date: values.end_date,
    trip_type: values.trip_type,
    character_id: Number(values.character_id),
    planned_budget: budget === "" ? null : Number(budget.replace(",", ".")),
  };
}

/** Dane podróży z API → wartości pól formularza (tryb edycji) */
function toValues(trip: Trip): FormValues {
  return {
    name: trip.name,
    destination_city: trip.destination_city,
    destination_country: trip.destination_country,
    start_date: trip.start_date,
    end_date: trip.end_date,
    planned_budget: trip.planned_budget === null ? "" : String(trip.planned_budget).replace(".", ","),
    trip_type: trip.trip_type,
    character_id: String(trip.character.id),
  };
}

const EMPTY_VALUES: FormValues = {
  name: "",
  destination_city: "",
  destination_country: "",
  start_date: "",
  end_date: "",
  planned_budget: "",
  trip_type: "foreign",
  character_id: "",
};

interface FieldProps {
  id: FieldName;
  label: string;
  error?: string;
  children: ReactNode;
}

/** Etykieta WERSALIKAMI nad polem + komunikat błędu pod polem */
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError} data-testid={`error-${id.replaceAll("_", "-")}`}>
          {error}
        </p>
      )}
    </div>
  );
}

// Formularz podróży (makieta 8): nowa – POST /api/trips, edycja (/podroze/:id/edycja) – PUT /api/trips/{id}
// z dodawaniem zdjęcia. Listy wyboru z GET /api/dictionaries.
export default function TripFormPage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const editing = tripId !== undefined;
  const backTo = editing ? `/podroze/${tripId}` : "/podroze";
  const [dict, setDict] = useState<DictState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Wartości zaraz po wczytaniu formularza – porównanie z nimi mówi, czy są niezapisane zmiany
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const { confirm, confirmDialog } = useConfirm();
  const dirty = initialValues !== null && JSON.stringify(values) !== JSON.stringify(initialValues);

  // Odświeżenie lub zamknięcie karty przy niezapisanych zmianach – ostrzeżenie przeglądarki
  // (tego okna nie da się ostylować; treść ustala przeglądarka)
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<Dictionaries>("/dictionaries"),
      tripId === undefined ? Promise.resolve(null) : api.get<Trip>(`/trips/${tripId}`),
    ])
      .then(([data, trip]) => {
        if (cancelled) return;
        setDict({ status: "ready", data, trip });
        if (trip) {
          setValues(toValues(trip));
          setInitialValues(toValues(trip));
          return;
        }
        // Domyślny charakter jak w makiecie: „Miasto”
        const city = data.trip_characters.find((c) => c.code === "city") ?? data.trip_characters[0];
        const withCharacter = (v: FormValues) =>
          city && v.character_id === "" ? { ...v, character_id: String(city.id) } : v;
        setValues(withCharacter);
        setInitialValues(withCharacter(EMPTY_VALUES));
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setDict({
            status: "error",
            message:
              error instanceof ApiError && error.status === 404
                ? "Nie znaleziono podróży."
                : error instanceof ApiError
                  ? error.message
                  : "Nie udało się wczytać formularza.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, reloadKey]);

  function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  // Wspólne atrybuty pola: id, opis błędu dla czytników ekranu, data-testid
  function fieldProps(field: FieldName, testId: string) {
    const error = fieldErrors[field];
    return {
      id: field,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${field}-error` : undefined,
      "data-testid": testId,
    };
  }

  // „← Wróć” i „Anuluj”: przy niezapisanych zmianach najpierw pytamy
  async function leave() {
    if (dirty) {
      const confirmed = await confirm({
        title: "Wyjść bez zapisania?",
        message: "Zmiany w formularzu nie zostały zapisane i zostaną utracone.",
        confirmLabel: "Wyjdź bez zapisania",
        cancelLabel: "Zostań",
      });
      if (!confirmed) return;
    }
    navigate(backTo);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      setFormError("Popraw zaznaczone pola.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put<Trip>(`/trips/${tripId}`, toInput(values));
        navigate(backTo);
      } else {
        await api.post<Trip>("/trips", toInput(values));
        navigate("/podroze");
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors.length > 0) {
        const serverErrors: FieldErrors = {};
        for (const e of error.errors) serverErrors[e.field as FieldName] = "Nieprawidłowa wartość.";
        setFieldErrors(serverErrors);
      }
      // Zmiana na krajową, gdy podróż ma loty (makieta 8) – błąd także przy polu „Typ”
      if (error instanceof ApiError && error.code === "TRIP_TYPE_CHANGE_BLOCKED") {
        setFieldErrors({ trip_type: error.message });
      }
      setFormError(error instanceof ApiError ? error.message : "Nie udało się zapisać podróży.");
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link
        to={backTo}
        className={styles.back}
        onClick={(e) => {
          e.preventDefault();
          leave();
        }}
        data-testid="link-back"
      >
        <span className={styles.backArrow} aria-hidden="true">←</span> {editing ? "Wróć do podróży" : "Moje podróże"}
      </Link>
      <h1 className={styles.title}>{editing ? "Edytuj podróż" : "Nowa podróż"}</h1>

      {dict.status === "loading" ? (
        <p className={styles.muted} role="status" data-testid="trip-form-loading">
          Wczytywanie formularza…
        </p>
      ) : dict.status === "error" ? (
        <div className={styles.formError} role="alert" data-testid="trip-form-load-error">
          <p>{dict.message}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setDict({ status: "loading" });
              setReloadKey((k) => k + 1);
            }}
            data-testid="trip-form-retry"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : dict.trip?.is_read_only ? (
        <div className={styles.formError} role="alert" data-testid="trip-form-readonly">
          <p>Podróż jest w archiwum – nie można jej edytować. Aby coś zmienić, cofnij jej status.</p>
          <Link to={backTo} className={styles.backLink}>
            Wróć do podróży
          </Link>
        </div>
      ) : (
        <>
          <form className={styles.form} onSubmit={onSubmit} noValidate data-testid="trip-form">
            {formError && (
              <p className={styles.formError} role="alert" data-testid="trip-form-error">
                {formError}
              </p>
            )}

            <div className={styles.grid}>
              <Field id="name" label="Nazwa" error={fieldErrors.name}>
                <input
                  {...fieldProps("name", "input-trip-name")}
                  className={styles.field}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field id="destination_city" label="Miasto" error={fieldErrors.destination_city}>
                <input
                  {...fieldProps("destination_city", "input-trip-city")}
                  className={styles.field}
                  value={values.destination_city}
                  onChange={(e) => set("destination_city", e.target.value)}
                />
              </Field>
              <Field id="destination_country" label="Kraj" error={fieldErrors.destination_country}>
                <input
                  {...fieldProps("destination_country", "input-trip-country")}
                  className={styles.field}
                  value={values.destination_country}
                  onChange={(e) => set("destination_country", e.target.value)}
                />
              </Field>
              <Field id="planned_budget" label="Budżet (PLN, opcjonalnie)" error={fieldErrors.planned_budget}>
                <input
                  {...fieldProps("planned_budget", "input-trip-budget")}
                  inputMode="decimal"
                  className={styles.field}
                  value={values.planned_budget}
                  onChange={(e) => set("planned_budget", e.target.value)}
                />
              </Field>
              <Field id="start_date" label="Data od" error={fieldErrors.start_date}>
                <input
                  {...fieldProps("start_date", "input-trip-start")}
                  type="date"
                  className={styles.field}
                  value={values.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
              </Field>
              <Field id="end_date" label="Data do" error={fieldErrors.end_date}>
                <input
                  {...fieldProps("end_date", "input-trip-end")}
                  type="date"
                  className={styles.field}
                  value={values.end_date}
                  min={values.start_date || undefined}
                  onChange={(e) => set("end_date", e.target.value)}
                />
              </Field>
              <Field id="trip_type" label="Typ" error={fieldErrors.trip_type}>
                <select
                  {...fieldProps("trip_type", "select-trip-type")}
                  className={styles.field}
                  value={values.trip_type}
                  onChange={(e) => set("trip_type", e.target.value as TripType)}
                >
                  {dict.data.trip_types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {capitalize(t.label)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="character_id" label="Charakter" error={fieldErrors.character_id}>
                <select
                  {...fieldProps("character_id", "select-trip-character")}
                  className={styles.field}
                  value={values.character_id}
                  onChange={(e) => set("character_id", e.target.value)}
                >
                  {dict.data.trip_characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={leave}
                data-testid="btn-cancel-trip"
              >
                Anuluj
              </button>
              <button type="submit" className={styles.primary} disabled={saving} data-testid="btn-save-trip">
                {saving ? "Zapisywanie…" : editing ? "Zapisz zmiany" : "Zapisz podróż"}
              </button>
            </div>
          </form>
          {dict.trip && (
            <PhotoUpload tripId={dict.trip.id} startDate={dict.trip.start_date} endDate={dict.trip.end_date} />
          )}
        </>
      )}
      {confirmDialog}
    </div>
  );
}
