import { Locator, Page } from '@playwright/test';

export class RatesWidgetComponent {
  container: Locator;
  title: Locator;
  ratesList: Locator;
  ratesDate: Locator;
  amountInput: Locator;

  constructor(private page: Page) {
    this.container = this.page.getByTestId('widget-nbp');
    this.title = this.container.getByRole('heading');
    this.ratesList = this.page.getByTestId('rates-list');
    this.ratesDate = this.page.getByTestId('rates-date');
    this.amountInput = this.page.getByTestId('input-convert-amount');
  }
}
