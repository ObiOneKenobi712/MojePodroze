import { MainMenuComponent } from "@_src/components/main-menu.component";
import { RatesWidgetComponent } from "@_src/components/rates-widget.component";
import { StatusTabsComponent } from "@_src/components/status-tabs.component";
import { WeatherWidgetComponent } from "@_src/components/weather-widget.component";
import { BasePage } from "@_src/pages/base.page";
import { Locator, Page } from "@playwright/test";

export class MyTripsPage extends BasePage {
  url = "/podroze";
  mainMenu: MainMenuComponent;
  statusTabs: StatusTabsComponent;
  weatherWidget: WeatherWidgetComponent;
  ratesWidget: RatesWidgetComponent;
  newTripButton: Locator;
  searchInput: Locator;
  tripCards: Locator;
  emptyListText: Locator;

  constructor(page: Page) {
    super(page);
    this.mainMenu = new MainMenuComponent(this.page);
    this.statusTabs = new StatusTabsComponent(this.page);
    this.weatherWidget = new WeatherWidgetComponent(this.page);
    this.ratesWidget = new RatesWidgetComponent(this.page);
    this.newTripButton = this.page.getByTestId("btn-new-trip");
    this.searchInput = this.page.getByTestId("input-search");
    this.tripCards = this.page.getByTestId("trip-card");
    this.emptyListText = this.page.getByTestId("trips-empty");
  }
}
