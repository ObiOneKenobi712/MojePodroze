import { ChecklistSectionComponent } from "@_src/components/checklist-section.component";
import { CostSummaryComponent } from "@_src/components/cost-summary.component";
import { DiarySectionComponent } from "@_src/components/diary-section.component";
import { ExpensesSectionComponent } from "@_src/components/expenses-section.component";
import { FlightsSectionComponent } from "@_src/components/flights-section.component";
import { MealsSectionComponent } from "@_src/components/meals-section.component";
import { PlacesSectionComponent } from "@_src/components/places-section.component";
import { PlanSectionComponent } from "@_src/components/plan-section.component";
import { RecommendationsComponent } from "@_src/components/recommendations.component";
import { SectionTabsComponent } from "@_src/components/section-tabs.component";
import { TransportSectionComponent } from "@_src/components/transport-section.component";
import { TripAlbumComponent } from "@_src/components/trip-album.component";
import { TripDetailsModel } from "@_src/models/trip-details.model";
import { BasePage } from "@_src/pages/base.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { TripFormPage } from "@_src/pages/trip-form.page";
import { step } from "@_src/utils/step.decorator";
import { parseTripCardData } from "@_src/utils/trip.util";
import { DeleteTripDialogView } from "@_src/views/delete-trip-dialog.view";
import { Locator, Page } from "@playwright/test";

export class TripPage extends BasePage {
  url = "/podroze";
  sectionTabs: SectionTabsComponent;
  planSection: PlanSectionComponent;
  flightsSection: FlightsSectionComponent;
  transportSection: TransportSectionComponent;
  mealsSection: MealsSectionComponent;
  placesSection: PlacesSectionComponent;
  expensesSection: ExpensesSectionComponent;
  diarySection: DiarySectionComponent;
  wishlistSection: ChecklistSectionComponent;
  packingSection: ChecklistSectionComponent;
  costSummary: CostSummaryComponent;
  recommendations: RecommendationsComponent;
  album: TripAlbumComponent;
  tripTitle: Locator;
  tripStatus: Locator;
  tripHeaderDetails: Locator;
  overviewValues: Locator;
  overviewBudget: Locator;
  backLink: Locator;
  editButton: Locator;
  deleteButton: Locator;
  startTripButton: Locator;
  completeTripButton: Locator;
  archiveButton: Locator;
  revertStatusButton: Locator;
  readOnlyNotice: Locator;
  loadErrorText: Locator;

  constructor(page: Page) {
    super(page);
    this.sectionTabs = new SectionTabsComponent(this.page);
    this.planSection = new PlanSectionComponent(this.page);
    this.flightsSection = new FlightsSectionComponent(this.page);
    this.transportSection = new TransportSectionComponent(this.page);
    this.mealsSection = new MealsSectionComponent(this.page);
    this.placesSection = new PlacesSectionComponent(this.page);
    this.expensesSection = new ExpensesSectionComponent(this.page);
    this.diarySection = new DiarySectionComponent(this.page);
    this.wishlistSection = new ChecklistSectionComponent(this.page, "wishlist-item", "wishlist");
    this.packingSection = new ChecklistSectionComponent(this.page, "packing-item", "packing");
    this.costSummary = new CostSummaryComponent(this.page);
    this.recommendations = new RecommendationsComponent(this.page);
    this.album = new TripAlbumComponent(this.page);
    this.tripTitle = this.page.getByTestId("trip-details-title");
    this.tripStatus = this.page.getByTestId("trip-status");
    this.tripHeaderDetails = this.page.getByTestId("trip-details").getByRole("paragraph").first();
    this.overviewValues = this.page.getByRole("definition");
    this.overviewBudget = this.page.getByTestId("trip-budget");
    this.backLink = this.page.getByTestId("link-back");
    this.editButton = this.page.getByTestId("btn-edit-trip");
    this.deleteButton = this.page.getByTestId("btn-delete-trip");
    this.startTripButton = this.page.getByTestId("btn-status-in-progress");
    this.completeTripButton = this.page.getByTestId("btn-status-completed");
    this.archiveButton = this.page.getByTestId("btn-status-archived");
    this.revertStatusButton = this.page.getByRole("button", { name: "Cofnij status" });
    this.readOnlyNotice = this.page.getByTestId("trip-readonly-notice");
    this.loadErrorText = this.page.getByTestId("trip-details-error");
  }

  @step("Odczytaj szczegóły podróży")
  async getTripDetails(): Promise<TripDetailsModel> {
    const tripName = (await this.tripTitle.textContent()) ?? "";
    const status = (await this.tripStatus.textContent()) ?? "";
    const headerDetails = parseTripCardData((await this.tripHeaderDetails.textContent()) ?? "");
    const [destination, period, duration, budget] = await this.overviewValues.allTextContents();

    return { tripName, status, ...headerDetails, destination, period, duration, budget };
  }

  @step((tripId: number) => `Otwórz adres edycji podróży ${tripId}`)
  async gotoEditForm(tripId: number): Promise<TripFormPage> {
    await this.goto(`/${tripId}/edycja`);
    return new TripFormPage(this.page);
  }

  @step("Kliknij „Edytuj”")
  async clickEditButton(): Promise<TripFormPage> {
    await this.editButton.click();
    return new TripFormPage(this.page);
  }

  @step("Kliknij „Usuń podróż”")
  async clickDeleteButton(): Promise<DeleteTripDialogView> {
    await this.deleteButton.click();
    return new DeleteTripDialogView(this.page);
  }

  @step("Kliknij „Rozpocznij podróż”")
  async clickStartTripButton(): Promise<void> {
    await this.startTripButton.click();
  }

  @step("Kliknij „Zakończ podróż”")
  async clickCompleteTripButton(): Promise<void> {
    await this.completeTripButton.click();
  }

  @step("Przenieś podróż do archiwum")
  async clickArchiveButton(): Promise<void> {
    await this.archiveButton.click();
  }

  @step("Kliknij „Cofnij”")
  async clickRevertStatusButton(): Promise<void> {
    await this.revertStatusButton.click();
  }

  @step("Wróć do listy Moje podróże")
  async clickBackLink(): Promise<MyTripsPage> {
    await this.backLink.click();
    return new MyTripsPage(this.page);
  }
}
