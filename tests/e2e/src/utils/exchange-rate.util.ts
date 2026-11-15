import { CurrencyCode } from "@_src/enums/currency.enum";
import { ExchangeRateModel, ExchangeRatesModel } from "@_src/models/exchange-rates.model";
import { formatTripCardDate } from "@_src/utils/date.util";
import { formatMoney } from "@_src/utils/money.util";

export function findRate(exchangeRates: ExchangeRatesModel, code: CurrencyCode): ExchangeRateModel {
  const rate = exchangeRates.rates.find((rate) => rate.code === code);

  if (rate === undefined) {
    throw new Error(`API nie zwróciło kursu waluty ${code}.`);
  }

  return rate;
}

export function formatRate(mid: number): string {
  return mid.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function getExpectedRateButtonText(rate: ExchangeRateModel): string {
  return `${rate.code} ${formatRate(rate.mid)}`;
}

export function getExpectedRatesDateText(exchangeRates: ExchangeRatesModel): string {
  return `Kurs średni z ${formatTripCardDate(exchangeRates.effective_date)}`;
}

// Liczymy na liczbach całkowitych (grosze × kurs z 4 miejscami po przecinku),
// żeby uniknąć błędów zaokrągleń liczb ułamkowych, np. 12,50 × 3,9101 = 48,87625 → 48,88
export function convertToPln(amount: number, mid: number): number {
  const amountInGrosze = Math.round(amount * 100);
  const rateInTenThousandths = Math.round(mid * 10000);
  const resultInGrosze = Math.round((amountInGrosze * rateInTenThousandths) / 10000);

  return resultInGrosze / 100;
}

export function getExpectedConversionText(amount: number, rate: ExchangeRateModel): string {
  return `= ${formatMoney(convertToPln(amount, rate.mid))}`;
}
