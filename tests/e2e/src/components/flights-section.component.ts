import { ItemSectionComponent } from "@_src/components/item-section.component";
import { FlightFormModel } from "@_src/models/flight-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class FlightsSectionComponent extends ItemSectionComponent {
  flightNumberInput: Locator;
  departureAirportInput: Locator;
  arrivalAirportInput: Locator;
  departureAtInput: Locator;
  arrivalAtInput: Locator;
  costInput: Locator;
  ratingSelect: Locator;
  ratingOptions: Locator;

  flightNumberError: Locator;
  departureAirportError: Locator;
  arrivalAirportError: Locator;
  departureAtError: Locator;
  arrivalAtError: Locator;
  costError: Locator;

  constructor(page: Page) {
    super(page, "flight", "flights");

    this.flightNumberInput = this.getInput("number");
    this.departureAirportInput = this.getInput("from");
    this.arrivalAirportInput = this.getInput("to");
    this.departureAtInput = this.getInput("departure");
    this.arrivalAtInput = this.getInput("arrival");
    this.costInput = this.getInput("cost");
    this.ratingSelect = this.getSelect("rating");
    this.ratingOptions = this.ratingSelect.getByRole("option");

    this.flightNumberError = this.getFieldError("flight-number");
    this.departureAirportError = this.getFieldError("departure-airport");
    this.arrivalAirportError = this.getFieldError("arrival-airport");
    this.departureAtError = this.getFieldError("departure-at");
    this.arrivalAtError = this.getFieldError("arrival-at");
    this.costError = this.getFieldError("cost");
  }

  @step((flight: FlightFormModel) => `Wypełnij formularz lotu „${flight.flightNumber}”`)
  async fillForm(flight: FlightFormModel): Promise<void> {
    await this.flightNumberInput.fill(flight.flightNumber);
    await this.departureAirportInput.fill(flight.departureAirport);
    await this.arrivalAirportInput.fill(flight.arrivalAirport);
    await this.departureAtInput.fill(flight.departureAt);
    await this.arrivalAtInput.fill(flight.arrivalAt ?? "");
    await this.costInput.fill(flight.cost);
    await this.ratingSelect.selectOption(flight.rating ?? "");
  }

  @step((flight: FlightFormModel) => `Dodaj lot „${flight.flightNumber}”`)
  async addFlight(flight: FlightFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(flight);
    await this.saveButton.click();
  }

  @step((title: string) => `Edytuj lot „${title}”`)
  async editFlight(title: string, flight: FlightFormModel): Promise<void> {
    await this.clickEditItemButton(title);
    await this.fillForm(flight);
    await this.saveButton.click();
  }
}
