import { step } from "@_src/utils/step.decorator";
import { ConfirmDialogView } from "@_src/views/confirm-dialog.view";
import { Locator, Page } from "@playwright/test";

export class ItemSectionComponent {
  section: Locator;
  addButton: Locator;
  emptyText: Locator;
  form: Locator;
  formTitle: Locator;
  formError: Locator;
  saveButton: Locator;
  formSelects: Locator;
  items: Locator;
  itemButtons: Locator;
  total: Locator;
  dayHeadings: Locator;

  constructor(
    protected page: Page,
    protected itemTestId: string,
    sectionTestId: string,
  ) {
    this.section = this.page.getByTestId(`${sectionTestId}-section`);
    this.addButton = this.page.getByTestId(`btn-add-${itemTestId}`);
    this.emptyText = this.page.getByTestId(`${sectionTestId}-empty`);
    this.form = this.page.getByTestId(`${itemTestId}-form`);
    this.formTitle = this.form.getByRole("heading");
    this.formError = this.page.getByTestId(`${itemTestId}-form-error`);
    this.saveButton = this.page.getByTestId(`btn-save-${itemTestId}`);
    this.formSelects = this.form.getByRole("combobox");
    this.items = this.section.getByRole("listitem");
    this.itemButtons = this.items.getByRole("button");
    this.total = this.page.getByTestId(`${sectionTestId}-total`);
    this.dayHeadings = this.section.getByRole("heading", { level: 3 });
  }

  getDayGroup(isoDate: string): Locator {
    return this.page.getByTestId(`${this.itemTestId}-day-${isoDate}`);
  }

  getDayHeading(isoDate: string): Locator {
    return this.getDayGroup(isoDate).getByRole("heading");
  }

  getDayItems(isoDate: string): Locator {
    return this.getDayGroup(isoDate).getByRole("listitem");
  }

  protected getInput(testKey: string): Locator {
    return this.page.getByTestId(`input-${this.itemTestId}-${testKey}`);
  }

  protected getSelect(testKey: string): Locator {
    return this.page.getByTestId(`select-${this.itemTestId}-${testKey}`);
  }

  protected getFieldError(fieldName: string): Locator {
    return this.page.getByTestId(`error-${this.itemTestId}-${fieldName}`);
  }

  getItemByTitle(title: string): Locator {
    return this.items.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  getItem(itemId: number): Locator {
    return this.page.getByTestId(`${this.itemTestId}-${itemId}`);
  }

  getEditButton(itemId: number): Locator {
    return this.page.getByTestId(`btn-edit-${this.itemTestId}-${itemId}`);
  }

  getCopyButton(itemId: number): Locator {
    return this.page.getByTestId(`btn-copy-${this.itemTestId}-${itemId}`);
  }

  getDeleteButton(itemId: number): Locator {
    return this.page.getByTestId(`btn-delete-${this.itemTestId}-${itemId}`);
  }

  @step("Kliknij przycisk dodawania pozycji")
  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  @step("Zapisz formularz pozycji")
  async clickSaveButton(): Promise<void> {
    await this.saveButton.click();
  }

  @step((title: string) => `Kliknij „Edytuj” przy pozycji „${title}”`)
  async clickEditItemButton(title: string): Promise<void> {
    await this.getItemByTitle(title).getByRole("button", { name: "Edytuj" }).click();
  }

  @step((title: string) => `Kliknij „Kopiuj” przy pozycji „${title}”`)
  async clickCopyItemButton(title: string): Promise<void> {
    await this.getItemByTitle(title).getByRole("button", { name: "Kopiuj" }).click();
  }

  @step((title: string) => `Kliknij „Usuń” przy pozycji „${title}”`)
  async clickDeleteItemButton(title: string): Promise<ConfirmDialogView> {
    await this.getItemByTitle(title).getByRole("button", { name: "Usuń" }).click();
    return new ConfirmDialogView(this.page);
  }

  @step("Kliknij „Usuń” przy pozycji")
  async clickDeleteButton(itemId: number): Promise<ConfirmDialogView> {
    await this.getDeleteButton(itemId).click();
    return new ConfirmDialogView(this.page);
  }
}
