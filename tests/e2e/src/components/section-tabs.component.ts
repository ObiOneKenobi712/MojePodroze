import { TripSectionTab } from "@_src/enums/trip.enum";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class SectionTabsComponent {
  tabList: Locator;
  tabs: Locator;

  constructor(private page: Page) {
    this.tabList = this.page.getByRole("tablist", { name: "Sekcje podróży" });
    this.tabs = this.tabList.getByRole("tab");
  }

  @step((tabName: TripSectionTab) => `Przejdź do zakładki „${tabName}”`)
  async clickTab(tabName: TripSectionTab): Promise<void> {
    await this.tabList.getByRole("tab", { name: tabName, exact: true }).click();
  }
}
