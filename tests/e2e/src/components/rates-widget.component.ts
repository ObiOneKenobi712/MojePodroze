import { CurrencyCode } from "@_src/enums/currency.enum";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class RatesWidgetComponent {
  container: Locator;
  title: Locator;
  ratesList: Locator;
  rateButtons: Locator;
  selectedRateButton: Locator;
  ratesDate: Locator;
  amountInput: Locator;
  amountError: Locator;
  convertResult: Locator;

  constructor(private page: Page) {
    this.container = this.page.getByTestId("widget-nbp");
    this.title = this.container.getByRole("heading");
    this.ratesList = this.page.getByTestId("rates-list");
    this.rateButtons = this.ratesList.getByRole("button");
    this.selectedRateButton = this.ratesList.getByRole("button", { pressed: true });
    this.ratesDate = this.page.getByTestId("rates-date");
    this.amountInput = this.page.getByTestId("input-convert-amount");
    this.amountError = this.page.getByTestId("convert-amount-error");
    this.convertResult = this.page.getByTestId("convert-result");
  }

  getRateButton(code: CurrencyCode): Locator {
    return this.page.getByTestId(`rate-${code}`);
  }

  @step((code: CurrencyCode) => `Wybierz walutę ${code} w kalkulatorze`)
  async clickRateButton(code: CurrencyCode): Promise<void> {
    await this.getRateButton(code).click();
  }

  @step((amount: string) => `Wpisz kwotę „${amount}” w kalkulatorze`)
  async fillAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
  }
}
