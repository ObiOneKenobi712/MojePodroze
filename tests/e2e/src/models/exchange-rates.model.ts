import { CurrencyCode } from "@_src/enums/currency.enum";

export interface ExchangeRateModel {
  code: CurrencyCode;
  currency: string;
  mid: number;
}

export interface ExchangeRatesModel {
  effective_date: string;
  rates: ExchangeRateModel[];
}
