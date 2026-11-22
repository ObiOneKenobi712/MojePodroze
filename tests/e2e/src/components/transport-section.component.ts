import { ItemSectionComponent } from "@_src/components/item-section.component";
import { TransportFormModel } from "@_src/models/transport-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class TransportSectionComponent extends ItemSectionComponent {
  transportMeanSelect: Locator;
  transportMeanOptions: Locator;
  selectedTransportMean: Locator;
  dateInput: Locator;
  routeFromInput: Locator;
  routeToInput: Locator;
  costInput: Locator;
  ratingSelect: Locator;

  dateError: Locator;
  routeFromError: Locator;
  routeToError: Locator;
  costError: Locator;

  constructor(page: Page) {
    super(page, "transport", "transports");

    this.transportMeanSelect = this.getSelect("mean");
    this.transportMeanOptions = this.transportMeanSelect.getByRole("option");
    this.selectedTransportMean = this.transportMeanSelect.getByRole("option", { selected: true });
    this.dateInput = this.getInput("date");
    this.routeFromInput = this.getInput("from");
    this.routeToInput = this.getInput("to");
    this.costInput = this.getInput("cost");
    this.ratingSelect = this.getSelect("rating");

    this.dateError = this.getFieldError("travel-date");
    this.routeFromError = this.getFieldError("route-from");
    this.routeToError = this.getFieldError("route-to");
    this.costError = this.getFieldError("cost");
  }

  @step((transport: TransportFormModel) => `Wypełnij formularz przejazdu „${transport.routeFrom} → ${transport.routeTo}”`)
  async fillForm(transport: TransportFormModel): Promise<void> {
    await this.transportMeanSelect.selectOption({ label: transport.transportMean });
    await this.dateInput.fill(transport.date);
    await this.routeFromInput.fill(transport.routeFrom);
    await this.routeToInput.fill(transport.routeTo);
    await this.costInput.fill(transport.cost);
    await this.ratingSelect.selectOption(transport.rating ?? "");
  }

  @step((transport: TransportFormModel) => `Dodaj przejazd „${transport.routeFrom} → ${transport.routeTo}”`)
  async addTransport(transport: TransportFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(transport);
    await this.saveButton.click();
  }

  @step((title: string) => `Edytuj przejazd „${title}”`)
  async editTransport(title: string, transport: TransportFormModel): Promise<void> {
    await this.clickEditItemButton(title);
    await this.fillForm(transport);
    await this.saveButton.click();
  }
}
