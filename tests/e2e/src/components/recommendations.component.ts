import { TripPage } from "@_src/pages/trip.page";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class RecommendationsComponent {
  section: Locator;
  emptyText: Locator;
  previousTripsText: Locator;
  restaurants: Locator;
  places: Locator;
  pendingWishlistHeading: Locator;
  pendingWishlist: Locator;

  constructor(private page: Page) {
    this.section = this.page.getByTestId("recommendations");
    this.emptyText = this.page.getByTestId("recommendations-empty");
    this.previousTripsText = this.section.getByRole("paragraph").first();
    this.restaurants = this.section.getByTestId(/^rec-restaurant-/);
    this.places = this.section.getByTestId(/^rec-place-/);
    this.pendingWishlistHeading = this.section.getByRole("heading", { name: "Nie udało się wtedy zobaczyć" });
    this.pendingWishlist = this.section.getByTestId(/^rec-wish-/);
  }

  @step((tripId: number) => `Kliknij link do wcześniejszej podróży ${tripId}`)
  async clickPreviousTripLink(tripId: number): Promise<TripPage> {
    await this.page.getByTestId(`rec-previous-trip-${tripId}`).click();
    return new TripPage(this.page);
  }
}
