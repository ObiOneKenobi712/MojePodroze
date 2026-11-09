import { StatusTabModel, StatusTabsModel } from "@_src/models/status-tab.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class StatusTabsComponent {
  allTab: Locator;
  plannedTab: Locator;
  inProgressTab: Locator;
  completedTab: Locator;
  archivedTab: Locator;
  tabs: Locator;
  activeTab: Locator;

  constructor(private page: Page) {
    this.tabs = this.page.getByRole("tablist", { name: "Status podróży" }).getByRole("tab");
    this.activeTab = this.page.getByRole("tablist", { name: "Status podróży" }).getByRole("tab", { selected: true });
    this.allTab = this.page.getByTestId("status-tab-all");
    this.plannedTab = this.page.getByTestId("status-tab-planned");
    this.inProgressTab = this.page.getByTestId("status-tab-in-progress");
    this.completedTab = this.page.getByTestId("status-tab-completed");
    this.archivedTab = this.page.getByTestId("status-tab-archived");
  }

  @step("Odczytaj nazwy i liczniki zakładek statusów")
  async getTabs(): Promise<StatusTabsModel> {
    return {
      all: await this.readTab(this.allTab),
      planned: await this.readTab(this.plannedTab),
      inProgress: await this.readTab(this.inProgressTab),
      completed: await this.readTab(this.completedTab),
      archived: await this.readTab(this.archivedTab),
    };
  }

  async readTab(tab: Locator): Promise<StatusTabModel> {
    const tabText = (await tab.textContent()) ?? "";
    const words = tabText.trim().split(" ");
    const count = Number(words.pop());

    return { name: words.join(" "), count };
  }

  @step("Wybierz zakładkę „Wszystkie”")
  async clickAllTab(): Promise<void> {
    await this.allTab.click();
  }

  @step("Wybierz zakładkę „W planie”")
  async clickPlannedTab(): Promise<void> {
    await this.plannedTab.click();
  }

  @step("Wybierz zakładkę „W trakcie”")
  async clickInProgressTab(): Promise<void> {
    await this.inProgressTab.click();
  }

  @step("Wybierz zakładkę „Zrealizowane”")
  async clickCompletedTab(): Promise<void> {
    await this.completedTab.click();
  }

  @step("Wybierz zakładkę „Archiwum”")
  async clickArchivedTab(): Promise<void> {
    await this.archivedTab.click();
  }
}
