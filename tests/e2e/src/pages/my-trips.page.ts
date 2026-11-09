import { MainMenuComponent } from "@_src/components/main-menu.component";
import { RatesWidgetComponent } from "@_src/components/rates-widget.component";
import { StatusTabsComponent } from "@_src/components/status-tabs.component";
import { WeatherWidgetComponent } from "@_src/components/weather-widget.component";
import { TripCardModel } from "@_src/models/trip-card.model";
import { BasePage } from "@_src/pages/base.page";
import { TripPage } from "@_src/pages/trip.page";
import { step } from "@_src/utils/step.decorator";
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
  tripCardStatuses: Locator;
  tripCardNames: Locator;
  tripCardDetails: Locator;
  loadingText: Locator;
  nextTripCountdown: Locator;
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
    this.tripCardStatuses = this.tripCards.getByTestId("trip-status");
    this.tripCardNames = this.tripCards.getByRole("heading");
    this.tripCardDetails = this.tripCards.getByRole("paragraph");
    this.loadingText = this.page.getByTestId("trips-loading");
    this.nextTripCountdown = this.page.getByTestId("countdown");
    this.emptyListText = this.page.getByTestId("trips-empty");
  }

  getCardByName(tripName: string): Locator {
    return this.tripCards.filter({
      has: this.page.getByRole("heading", { name: tripName, exact: true }),
    });
  }

  async readTripCard(card: Locator): Promise<TripCardModel> {
    const tripName = (await card.getByRole("heading").textContent()) ?? "";
    const status = (await card.getByTestId("trip-status").textContent()) ?? "";
    const details = (await card.getByRole("paragraph").textContent()) ?? "";

    const [dates, tripType, tripCharacter] = details.split(" · , ");
    const [tripDateFrom, tripDateTo] = dates.split(" – ");

    const tripCard: TripCardModel = { tripName, status, tripDateFrom, tripDateTo, tripType, tripCharacter };
    return tripCard;
  }

  @step((tripName: string) => `Odczytaj kartę podróży „${tripName}”`)
  async getTripCard(tripName: string): Promise<TripCardModel> {
    return this.readTripCard(this.getCardByName(tripName));
  }

  @step("Odczytaj wszystkie karty podróży z listy")
  async getAllTripCards(): Promise<TripCardModel[]> {
    const cards: TripCardModel[] = [];

    for (const card of await this.tripCards.all()) {
      cards.push(await this.readTripCard(card));
    }

    return cards;
  }

  @step((tripName: string) => `Otwórz podróż „${tripName}”`)
  async clickTripCard(tripName: string): Promise<TripPage> {
    await this.getCardByName(tripName).click();
    return new TripPage(this.page);
  }
}
