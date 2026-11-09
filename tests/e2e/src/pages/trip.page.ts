import { BasePage } from "@_src/pages/base.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class TripPage extends BasePage {
  url = "/podroze";
  tripTitle: Locator;
  tripStatus: Locator;
  backLink: Locator;
  archiveButton: Locator;
  readOnlyNotice: Locator;

  constructor(page: Page) {
    super(page);
    this.tripTitle = this.page.getByTestId("trip-details-title");
    this.tripStatus = this.page.getByTestId("trip-status");
    this.backLink = this.page.getByTestId("link-back");
    this.archiveButton = this.page.getByTestId("btn-status-archived");
    this.readOnlyNotice = this.page.getByTestId("trip-readonly-notice");
  }

  @step("Przenieś podróż do archiwum")
  async clickArchiveButton(): Promise<void> {
    await this.archiveButton.click();
  }

  @step("Wróć do listy Moje podróże")
  async clickBackLink(): Promise<MyTripsPage> {
    await this.backLink.click();
    return new MyTripsPage(this.page);
  }
}
