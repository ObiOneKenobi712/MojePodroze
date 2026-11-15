import { Locator, Page } from "@playwright/test";

export class TripAlbumComponent {
  emptyText: Locator;
  addPhotosLink: Locator;

  constructor(private page: Page) {
    this.emptyText = this.page.getByTestId("album-empty");
    this.addPhotosLink = this.page.getByTestId("link-add-photos");
  }

  getDayGroup(isoDate: string): Locator {
    return this.page.getByTestId(`album-day-${isoDate}`);
  }

  getDayHeading(isoDate: string): Locator {
    return this.getDayGroup(isoDate).getByRole("heading");
  }

  getDayPhotos(isoDate: string): Locator {
    return this.getDayGroup(isoDate).getByRole("button", { name: "Powiększ" });
  }
}
