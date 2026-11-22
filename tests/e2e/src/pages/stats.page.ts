import { MainMenuComponent } from "@_src/components/main-menu.component";
import { BasePage } from "@_src/pages/base.page";
import { Locator, Page } from "@playwright/test";

export class StatsPage extends BasePage {
  url = "/statystyki";
  mainMenu: MainMenuComponent;
  statsContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.mainMenu = new MainMenuComponent(this.page);
    this.statsContainer = this.page.getByTestId("stats");
  }
}
