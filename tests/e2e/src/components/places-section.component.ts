import { ItemSectionComponent } from "@_src/components/item-section.component";
import { PlaceFormModel, PlaceKind } from "@_src/models/place-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class PlacesSectionComponent extends ItemSectionComponent {
  nameInput: Locator;
  kindSelect: Locator;
  dateInput: Locator;
  checkOutDateInput: Locator;
  costInput: Locator;
  ratingSelect: Locator;
  noteInput: Locator;

  nameError: Locator;
  dateError: Locator;
  checkOutDateError: Locator;
  costError: Locator;

  constructor(page: Page) {
    super(page, "place", "places");

    this.nameInput = this.getInput("name");
    this.kindSelect = this.getSelect("kind");
    this.dateInput = this.getInput("date");
    this.checkOutDateInput = this.getInput("check-out");
    this.costInput = this.getInput("cost");
    this.ratingSelect = this.getSelect("rating");
    this.noteInput = this.getInput("note");

    this.nameError = this.getFieldError("name");
    this.dateError = this.getFieldError("visit-date");
    this.checkOutDateError = this.getFieldError("check-out-date");
    this.costError = this.getFieldError("cost");
  }

  @step((kind: PlaceKind) => `Wybierz rodzaj „${kind}”`)
  async selectKind(kind: PlaceKind): Promise<void> {
    await this.kindSelect.selectOption(kind);
  }

  @step((place: PlaceFormModel) => `Wypełnij formularz noclegu lub atrakcji „${place.name}”`)
  async fillForm(place: PlaceFormModel): Promise<void> {
    await this.nameInput.fill(place.name);
    await this.kindSelect.selectOption(place.kind);
    await this.dateInput.fill(place.date);

    if (place.kind === "accommodation") {
      await this.checkOutDateInput.fill(place.checkOutDate ?? "");
    }

    await this.costInput.fill(place.cost);
    await this.ratingSelect.selectOption(place.rating ?? "");
    await this.noteInput.fill(place.note ?? "");
  }

  @step((place: PlaceFormModel) => `Dodaj nocleg lub atrakcję „${place.name}”`)
  async addPlace(place: PlaceFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(place);
    await this.saveButton.click();
  }

  @step((name: string) => `Edytuj nocleg lub atrakcję „${name}”`)
  async editPlace(name: string, place: PlaceFormModel): Promise<void> {
    await this.clickEditItemButton(name);
    await this.fillForm(place);
    await this.saveButton.click();
  }
}
