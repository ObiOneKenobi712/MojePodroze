import { TripCharacterId, TripType } from "@_src/enums/trip.enum";
import { PhotoFileModel } from "@_src/models/photo-file.model";
import { AddTripModel } from "@_src/models/trip.model";
import { BasePage } from "@_src/pages/base.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { TripPage } from "@_src/pages/trip.page";
import { step } from "@_src/utils/step.decorator";
import { ConfirmDialogView } from "@_src/views/confirm-dialog.view";
import { Locator, Page } from "@playwright/test";

export class TripFormPage extends BasePage {
  url = "/podroze/nowa";
  heading: Locator;
  nameInput: Locator;
  cityInput: Locator;
  countryInput: Locator;
  budgetInput: Locator;
  startDateInput: Locator;
  endDateInput: Locator;
  typeSelect: Locator;
  typeOptions: Locator;
  characterSelect: Locator;
  characterOptions: Locator;
  saveButton: Locator;
  cancelButton: Locator;
  formError: Locator;
  nameError: Locator;
  cityError: Locator;
  countryError: Locator;
  budgetError: Locator;
  startDateError: Locator;
  endDateError: Locator;
  typeError: Locator;
  readOnlyText: Locator;
  backToTripLink: Locator;
  backLink: Locator;
  photoInput: Locator;
  photoDayInput: Locator;
  uploadPhotoButton: Locator;
  photoUploadedText: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.getByRole("heading", { level: 1 });
    this.nameInput = this.page.getByTestId("input-trip-name");
    this.cityInput = this.page.getByTestId("input-trip-city");
    this.countryInput = this.page.getByTestId("input-trip-country");
    this.budgetInput = this.page.getByTestId("input-trip-budget");
    this.startDateInput = this.page.getByTestId("input-trip-start");
    this.endDateInput = this.page.getByTestId("input-trip-end");
    this.typeSelect = this.page.getByTestId("select-trip-type");
    this.typeOptions = this.typeSelect.getByRole("option");
    this.characterSelect = this.page.getByTestId("select-trip-character");
    this.characterOptions = this.characterSelect.getByRole("option");
    this.saveButton = this.page.getByTestId("btn-save-trip");
    this.cancelButton = this.page.getByTestId("btn-cancel-trip");
    this.formError = this.page.getByTestId("trip-form-error");
    this.nameError = this.page.getByTestId("error-name");
    this.cityError = this.page.getByTestId("error-destination-city");
    this.countryError = this.page.getByTestId("error-destination-country");
    this.budgetError = this.page.getByTestId("error-planned-budget");
    this.startDateError = this.page.getByTestId("error-start-date");
    this.endDateError = this.page.getByTestId("error-end-date");
    this.typeError = this.page.getByTestId("error-trip-type");
    this.readOnlyText = this.page.getByTestId("trip-form-readonly");
    this.backToTripLink = this.readOnlyText.getByRole("link", { name: "Wróć do podróży" });
    this.backLink = this.page.getByTestId("link-back");
    this.photoInput = this.page.getByTestId("input-trip-photo");
    this.photoDayInput = this.page.getByTestId("input-upload-day");
    this.uploadPhotoButton = this.page.getByTestId("btn-upload-photo");
    this.photoUploadedText = this.page.getByTestId("photo-uploaded");
  }

  @step((photo: PhotoFileModel, day: string) => `Wgraj zdjęcie „${photo.name}” do dnia ${day}`)
  async uploadPhoto(photo: PhotoFileModel, day: string): Promise<void> {
    await this.photoInput.setInputFiles(photo);
    await this.photoDayInput.fill(day);
    await this.uploadPhotoButton.click();
  }

  @step("Kliknij „Wróć do podróży”")
  async clickBackLink(): Promise<TripPage> {
    await this.backLink.click();
    return new TripPage(this.page);
  }

  @step((trip: AddTripModel) => `Dodaj podróż „${trip.name}” przez formularz`)
  async createTrip(trip: AddTripModel): Promise<MyTripsPage> {
    await this.fillForm(trip);
    await this.saveButton.click();
    return new MyTripsPage(this.page);
  }

  @step((trip: AddTripModel) => `Zapisz zmiany podróży „${trip.name}”`)
  async updateTrip(trip: AddTripModel): Promise<TripPage> {
    await this.fillForm(trip);
    await this.saveButton.click();
    return new TripPage(this.page);
  }

  @step((trip: AddTripModel) => `Wypełnij formularz podróży „${trip.name}”`)
  async fillForm(trip: AddTripModel): Promise<void> {
    await this.nameInput.fill(trip.name);
    await this.cityInput.fill(trip.destination_city);
    await this.countryInput.fill(trip.destination_country);
    await this.budgetInput.fill(
      trip.planned_budget === undefined || trip.planned_budget === null
        ? ""
        : String(trip.planned_budget).replace(".", ","),
    );
    await this.startDateInput.fill(trip.start_date);
    await this.endDateInput.fill(trip.end_date);
    await this.typeSelect.selectOption(trip.trip_type);
    await this.characterSelect.selectOption(String(trip.character_id));
  }

  @step((name: string) => `Wpisz nazwę podróży „${name}”`)
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  @step((budget: string) => `Wpisz budżet „${budget}”`)
  async fillBudget(budget: string): Promise<void> {
    await this.budgetInput.fill(budget);
  }

  @step((tripType: TripType) => `Wybierz typ podróży „${tripType}”`)
  async selectTripType(tripType: TripType): Promise<void> {
    await this.typeSelect.selectOption(tripType);
  }

  @step("Kliknij „Zapisz”")
  async clickSaveButton(): Promise<void> {
    await this.saveButton.click();
  }

  @step("Kliknij „Anuluj”")
  async clickCancelButton(): Promise<ConfirmDialogView> {
    await this.cancelButton.click();
    return new ConfirmDialogView(this.page);
  }

  @step("Kliknij „Wróć do podróży”")
  async clickBackToTripLink(): Promise<TripPage> {
    await this.backToTripLink.click();
    return new TripPage(this.page);
  }

  @step("Odczytaj wartości formularza podróży")
  async getFormValues(): Promise<AddTripModel> {
    const budget = await this.budgetInput.inputValue();

    return {
      name: await this.nameInput.inputValue(),
      destination_city: await this.cityInput.inputValue(),
      destination_country: await this.countryInput.inputValue(),
      start_date: await this.startDateInput.inputValue(),
      end_date: await this.endDateInput.inputValue(),
      trip_type: (await this.typeSelect.inputValue()) as TripType,
      character_id: Number(await this.characterSelect.inputValue()) as TripCharacterId,
      planned_budget: budget === "" ? null : Number(budget.replace(",", ".")),
    };
  }
}
