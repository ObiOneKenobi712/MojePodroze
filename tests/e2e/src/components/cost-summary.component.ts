import { BudgetLevel } from "@_src/enums/budget.enum";
import { CostSummaryModel } from "@_src/models/cost-summary.model";
import { TripFormPage } from "@_src/pages/trip-form.page";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class CostSummaryComponent {
  total: Locator;
  daily: Locator;
  rating: Locator;
  budget: Locator;
  budgetStatus: Locator;
  setBudgetLink: Locator;
  sectionsTable: Locator;
  footerCells: Locator;
  recommendations: Locator;

  constructor(private page: Page) {
    this.total = this.page.getByTestId("cost-total");
    this.daily = this.page.getByTestId("cost-daily");
    this.rating = this.page.getByTestId("cost-rating");
    this.budget = this.page.getByTestId("budget");
    this.budgetStatus = this.page.getByTestId("budget-status");
    this.setBudgetLink = this.budgetStatus.getByRole("link", { name: "Ustaw go w edycji podróży" });
    this.sectionsTable = this.page.getByTestId("cost-sections");
    this.footerCells = this.sectionsTable.getByRole("row").last().getByRole("cell");
    this.recommendations = this.page.getByTestId("recommendations");
  }

  getBudgetWithLevel(level: BudgetLevel): Locator {
    return this.budget.and(this.page.locator(`[data-level="${level}"]`));
  }

  getSectionRow(section: string): Locator {
    return this.page.getByTestId(`cost-section-${section}`);
  }

  getSectionCells(section: string): Locator {
    return this.getSectionRow(section).getByRole("cell");
  }

  @step("Odczytaj wartości kosztorysu")
  async getCostSummary(): Promise<CostSummaryModel> {
    return {
      total: (await this.total.textContent()) ?? "",
      daily: (await this.daily.textContent()) ?? "",
      rating: (await this.rating.textContent()) ?? "",
      budget: (await this.budget.textContent()) ?? "",
      sections: (await this.sectionsTable.textContent()) ?? "",
    };
  }

  @step("Kliknij „Ustaw go w edycji podróży”")
  async clickSetBudgetLink(): Promise<TripFormPage> {
    await this.setBudgetLink.click();
    return new TripFormPage(this.page);
  }
}
