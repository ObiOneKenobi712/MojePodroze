import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class ConfirmDialogView {
  dialog: Locator;
  title: Locator;
  message: Locator;
  cancelButton: Locator;
  confirmButton: Locator;

  constructor(protected page: Page) {
    this.dialog = this.page.getByTestId("confirm-dialog");
    this.title = this.dialog.getByRole("heading");
    this.message = this.dialog.getByRole("paragraph");
    this.cancelButton = this.page.getByTestId("btn-confirm-cancel");
    this.confirmButton = this.page.getByTestId("btn-confirm-ok");
  }

  @step("Anuluj w oknie dialogowym")
  async clickCancelButton(): Promise<void> {
    await this.cancelButton.click();
  }

  @step("Potwierdź w oknie dialogowym")
  async clickConfirmButton(): Promise<void> {
    await this.confirmButton.click();
  }
}
