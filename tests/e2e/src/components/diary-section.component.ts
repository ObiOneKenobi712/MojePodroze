import { ItemSectionComponent } from "@_src/components/item-section.component";
import { DiaryEntryFormModel } from "@_src/models/diary-entry-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class DiarySectionComponent extends ItemSectionComponent {
  dateInput: Locator;
  titleInput: Locator;
  contentInput: Locator;

  dateError: Locator;
  contentError: Locator;

  constructor(page: Page) {
    super(page, "diary-entry", "diary-entries");

    this.dateInput = this.getInput("date");
    this.titleInput = this.getInput("title");
    this.contentInput = this.getInput("content");

    this.dateError = this.getFieldError("entry-date");
    this.contentError = this.getFieldError("content");
  }

  @step((entry: DiaryEntryFormModel) => `Wypełnij formularz wpisu z dnia ${entry.date}`)
  async fillForm(entry: DiaryEntryFormModel): Promise<void> {
    await this.dateInput.fill(entry.date);
    await this.titleInput.fill(entry.title ?? "");
    await this.contentInput.fill(entry.content);
  }

  @step((entry: DiaryEntryFormModel) => `Dodaj wpis do pamiętnika z dnia ${entry.date}`)
  async addDiaryEntry(entry: DiaryEntryFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(entry);
    await this.saveButton.click();
  }

  @step((isoDate: string) => `Edytuj wpis pamiętnika z dnia ${isoDate}`)
  async editDiaryEntryInDay(isoDate: string, entry: DiaryEntryFormModel): Promise<void> {
    await this.getDayGroup(isoDate).getByRole("button", { name: "Edytuj" }).click();
    await this.fillForm(entry);
    await this.saveButton.click();
  }
}
