import { LoginPage } from "@_src/pages/login.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { StatsPage } from "@_src/pages/stats.page";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class MainMenuComponent {
  logoLink: Locator;
  myTripsTab: Locator;
  statsTab: Locator;
  activeTab: Locator;
  logoutButton: Locator;

  constructor(private page: Page) {
    this.logoLink = this.page.getByRole("banner").getByRole("link", { name: "Moje podróże" }).first();
    this.myTripsTab = this.page.getByTestId("nav-trips");
    this.statsTab = this.page.getByTestId("nav-stats");
    this.activeTab = this.page.getByRole("navigation", { name: "Główna nawigacja" }).locator('[aria-current="page"]');
    this.logoutButton = this.page.getByTestId("btn-logout");
  }

  @step("Kliknij logo „Moje podróże”")
  async clickLogoLink(): Promise<MyTripsPage> {
    await this.logoLink.click();
    return new MyTripsPage(this.page);
  }

  @step("Przejdź do zakładki „Moje podróże”")
  async clickMyTripsTab(): Promise<MyTripsPage> {
    await this.myTripsTab.click();
    return new MyTripsPage(this.page);
  }

  @step("Przejdź do zakładki „Statystyki”")
  async clickStatsTab(): Promise<StatsPage> {
    await this.statsTab.click();
    return new StatsPage(this.page);
  }

  @step("Wyloguj użytkownika")
  async clickLogoutButton(): Promise<LoginPage> {
    await this.logoutButton.click();
    return new LoginPage(this.page);
  }
}
