import { useEffect, useId, useState } from "react";
import type { Conversion, ExchangeRates } from "../../types/api";
import { api, ApiError } from "../../api/client";
import { formatDate, formatPln, formatRate } from "../../utils/format";
import Widget from "../../components/Widget/Widget";
import styles from "./TripsPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: ExchangeRates }
  | { status: "error"; message: string };

// Wynik przeliczenia zapamiętany razem z kwotą i walutą, których dotyczy
type ConvertResult =
  | { key: string; status: "ready"; amountPln: number }
  | { key: string; status: "error"; message: string };

// Kwota jak w backendzie: liczba ≥ 0, najwyżej 2 miejsca po przecinku (przecinek albo kropka)
const AMOUNT_PATTERN = /^\d{1,10}([.,]\d{1,2})?$/;
const CONVERT_DELAY_MS = 400;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Kursy z GET /api/exchange-rates, kalkulator przez GET /api/exchange-rates/convert
// (zapytanie po chwili przerwy w pisaniu). Błąd tylko w tym widżecie.
export default function RatesWidget() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("EUR");
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
  const id = useId();

  const value = amount.trim();
  const isValid = AMOUNT_PATTERN.test(value);
  const isInvalid = value !== "" && !isValid;
  const convertKey = `${value} ${currency}`;
  const convert = isValid && convertResult?.key === convertKey ? convertResult : null;

  useEffect(() => {
    let cancelled = false;
    api
      .get<ExchangeRates>("/exchange-rates")
      .then((data) => {
        if (!cancelled) setLoad({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: errorMessage(error, "Nie udało się pobrać kursów.") });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!isValid) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get<Conversion>(`/exchange-rates/convert?amount=${value.replace(",", ".")}&currency=${currency}`)
        .then((data) => {
          if (!cancelled) setConvertResult({ key: convertKey, status: "ready", amountPln: data.amount_pln });
        })
        .catch((error: unknown) => {
          if (!cancelled)
            setConvertResult({ key: convertKey, status: "error", message: errorMessage(error, "Nie udało się przeliczyć.") });
        });
    }, CONVERT_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, currency, convertKey, isValid, reloadKey]);

  function reload() {
    setLoad({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  const result = convert?.status === "ready" ? `= ${formatPln(convert.amountPln)}` : isValid && !convert ? "= …" : "= –";
  const convertError = convert?.status === "error" ? convert.message : null;

  return (
    <Widget title="Kursy NBP" accent="--widget-rates" testId="widget-nbp">
      {load.status === "loading" ? (
        <p className={styles.muted} role="status" data-testid="rates-loading">
          Wczytywanie kursów…
        </p>
      ) : load.status === "error" ? (
        <div className={styles.widgetError} role="alert" data-testid="rates-error">
          <p>{load.message}</p>
          <button type="button" className={styles.secondary} onClick={reload} data-testid="rates-retry">
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <>
          <div className={styles.rates} role="group" aria-label="Waluta kalkulatora" data-testid="rates-list">
            {load.data.rates.map((rate) => (
              <button
                key={rate.code}
                type="button"
                className={styles.ratePill}
                aria-pressed={rate.code === currency}
                onClick={() => setCurrency(rate.code)}
                data-testid={`rate-${rate.code}`}
              >
                <abbr title={rate.currency}>{rate.code}</abbr> {formatRate(rate.mid)}
              </button>
            ))}
          </div>
          <p className={styles.muted} data-testid="rates-date">
            Kurs średni z {formatDate(load.data.effective_date)}
          </p>
        </>
      )}

      <label htmlFor={id} className={styles.label}>
        Kwota w {currency}
      </label>
      <div className={styles.converter}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className={styles.field}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={isInvalid ? true : undefined}
          aria-describedby={isInvalid || convertError ? `${id}-error` : undefined}
          data-testid="input-convert-amount"
        />
        <output htmlFor={id} className={styles.result} aria-live="polite" data-testid="convert-result">
          {result}
        </output>
      </div>
      {isInvalid && (
        <p id={`${id}-error`} className={styles.fieldError} data-testid="convert-amount-error">
          Podaj kwotę, np. 100 albo 12,50.
        </p>
      )}
      {convertError && (
        <p id={`${id}-error`} className={styles.fieldError} role="alert" data-testid="convert-error">
          {convertError}
        </p>
      )}
    </Widget>
  );
}
