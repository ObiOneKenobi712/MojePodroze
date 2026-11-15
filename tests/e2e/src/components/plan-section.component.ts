import { ItemSectionComponent } from "@_src/components/item-section.component";
import { PlanPointFormModel } from "@_src/models/plan-point-form.model";
import { step } from "@_src/utils/step.decorator";
import { ConfirmDialogView } from "@_src/views/confirm-dialog.view";
import { Locator, Page } from "@playwright/test";

export class PlanSectionComponent extends ItemSectionComponent {
  placeInput: Locator;
  dayInput: Locator;
  timeInput: Locator;
  descriptionInput: Locator;

  placeError: Locator;
  dayError: Locator;

  constructor(page: Page) {
    super(page, "plan-point", "plan-points");

    this.placeInput = this.getInput("place");
    this.dayInput = this.getInput("day");
    this.timeInput = this.getInput("time");
    this.descriptionInput = this.getInput("description");

    this.placeError = this.getFieldError("place");
    this.dayError = this.getFieldError("day");
  }

  @step((point: PlanPointFormModel) => `Wypełnij formularz punktu planu „${point.place}”`)
  async fillForm(point: PlanPointFormModel): Promise<void> {
    await this.placeInput.fill(point.place);
    await this.dayInput.fill(point.day);
    await this.timeInput.fill(point.time ?? "");
    await this.descriptionInput.fill(point.description ?? "");
  }

  @step((point: PlanPointFormModel) => `Dodaj punkt planu „${point.place}”`)
  async addPlanPoint(point: PlanPointFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(point);
    await this.saveButton.click();
  }

  @step((place: string) => `Edytuj punkt planu „${place}”`)
  async editPlanPoint(place: string, point: PlanPointFormModel): Promise<void> {
    await this.clickEditItemButton(place);
    await this.fillForm(point);
    await this.saveButton.click();
  }

  @step((place: string, isoDate: string) => `Kliknij „Usuń” przy punkcie „${place}” z dnia ${isoDate}`)
  async clickDeleteButtonInDay(place: string, isoDate: string): Promise<ConfirmDialogView> {
    await this.getDayGroup(isoDate)
      .getByRole("listitem")
      .filter({ hasText: place })
      .getByRole("button", { name: "Usuń" })
      .click();
    return new ConfirmDialogView(this.page);
  }
}
