import { ChecklistItemFormModel } from "@_src/models/checklist-item-form.model";
import { step } from "@_src/utils/step.decorator";
import { ConfirmDialogView } from "@_src/views/confirm-dialog.view";
import { Locator, Page } from "@playwright/test";

export class ChecklistSectionComponent {
  section: Locator;
  title: Locator;
  nameInput: Locator;
  noteInput: Locator;
  addButton: Locator;
  addError: Locator;
  emptyText: Locator;
  progress: Locator;
  items: Locator;
  checkboxes: Locator;
  editNameInput: Locator;

  constructor(
    private page: Page,
    itemTestId: string,
    sectionTestId: string,
  ) {
    this.section = this.page.getByTestId(`${sectionTestId}-section`);
    this.title = this.section.getByRole("heading", { level: 2 });
    this.nameInput = this.page.getByTestId(`input-${itemTestId}-name`);
    this.noteInput = this.page.getByTestId(`input-${itemTestId}-note`);
    this.addButton = this.page.getByTestId(`btn-add-${itemTestId}`);
    this.addError = this.page.getByTestId(`${itemTestId}-add-error`);
    this.emptyText = this.page.getByTestId(`${sectionTestId}-empty`);
    this.progress = this.page.getByTestId(`${sectionTestId}-progress`);
    this.items = this.page.getByTestId(`${itemTestId}-list`).getByRole("listitem");
    this.checkboxes = this.section.getByRole("checkbox");
    this.editNameInput = this.page.getByTestId(`input-edit-${itemTestId}-name`);
  }

  getItemByName(name: string): Locator {
    return this.items.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  getCheckbox(name: string): Locator {
    return this.getItemByName(name).getByRole("checkbox");
  }

  @step("Kliknij „Dodaj” na liście")
  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  @step((item: ChecklistItemFormModel) => `Dodaj na listę „${item.name}”`)
  async addItem(item: ChecklistItemFormModel): Promise<void> {
    await this.nameInput.fill(item.name);

    if (item.note !== undefined) {
      await this.noteInput.fill(item.note);
    }

    await this.addButton.click();
  }

  @step((name: string) => `Kliknij pole wyboru przy „${name}”`)
  async clickCheckbox(name: string): Promise<void> {
    await this.getCheckbox(name).click();
  }

  @step((name: string, newName: string) => `Zmień nazwę „${name}” na „${newName}”`)
  async editItemName(name: string, newName: string): Promise<void> {
    await this.getItemByName(name).getByRole("button", { name: "Edytuj" }).click();
    await this.editNameInput.fill(newName);
    await this.section.getByRole("button", { name: "Zapisz" }).click();
  }

  @step((name: string) => `Kliknij „Usuń” przy „${name}”`)
  async clickDeleteItemButton(name: string): Promise<ConfirmDialogView> {
    await this.getItemByName(name).getByRole("button", { name: "Usuń" }).click();
    return new ConfirmDialogView(this.page);
  }
}
