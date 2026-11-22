import { ItemSectionComponent } from "@_src/components/item-section.component";
import { ExpenseFormModel } from "@_src/models/expense-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class ExpensesSectionComponent extends ItemSectionComponent {
  descriptionInput: Locator;
  categorySelect: Locator;
  categoryOptions: Locator;
  dateInput: Locator;
  costInput: Locator;

  descriptionError: Locator;
  costError: Locator;

  constructor(page: Page) {
    super(page, "expense", "expenses");

    this.descriptionInput = this.getInput("description");
    this.categorySelect = this.getSelect("category");
    this.categoryOptions = this.categorySelect.getByRole("option");
    this.dateInput = this.getInput("date");
    this.costInput = this.getInput("cost");

    this.descriptionError = this.getFieldError("description");
    this.costError = this.getFieldError("cost");
  }

  @step((expense: ExpenseFormModel) => `Wypełnij formularz wydatku „${expense.description}”`)
  async fillForm(expense: ExpenseFormModel): Promise<void> {
    await this.descriptionInput.fill(expense.description);
    await this.categorySelect.selectOption({ label: expense.category });
    await this.dateInput.fill(expense.date ?? "");
    await this.costInput.fill(expense.cost);
  }

  @step((expense: ExpenseFormModel) => `Dodaj wydatek „${expense.description}”`)
  async addExpense(expense: ExpenseFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(expense);
    await this.saveButton.click();
  }

  @step((description: string) => `Edytuj wydatek „${description}”`)
  async editExpense(description: string, expense: ExpenseFormModel): Promise<void> {
    await this.clickEditItemButton(description);
    await this.fillForm(expense);
    await this.saveButton.click();
  }
}
