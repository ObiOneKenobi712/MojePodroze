import { ItemSectionComponent } from "@_src/components/item-section.component";
import { MealFormModel } from "@_src/models/meal-form.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class MealsSectionComponent extends ItemSectionComponent {
  dishInput: Locator;
  restaurantInput: Locator;
  dateInput: Locator;
  costInput: Locator;
  ratingSelect: Locator;

  dishError: Locator;
  restaurantError: Locator;
  dateError: Locator;
  costError: Locator;

  constructor(page: Page) {
    super(page, "meal", "meals");

    this.dishInput = this.getInput("dish");
    this.restaurantInput = this.getInput("restaurant");
    this.dateInput = this.getInput("date");
    this.costInput = this.getInput("cost");
    this.ratingSelect = this.getSelect("rating");

    this.dishError = this.getFieldError("dish");
    this.restaurantError = this.getFieldError("restaurant-name");
    this.dateError = this.getFieldError("meal-date");
    this.costError = this.getFieldError("cost");
  }

  @step((meal: MealFormModel) => `Wypełnij formularz posiłku „${meal.dish}”`)
  async fillForm(meal: MealFormModel): Promise<void> {
    await this.dishInput.fill(meal.dish);
    await this.restaurantInput.fill(meal.restaurant);
    await this.dateInput.fill(meal.date);
    await this.costInput.fill(meal.cost);
    await this.ratingSelect.selectOption(meal.rating ?? "");
  }

  @step((meal: MealFormModel) => `Dodaj posiłek „${meal.dish}”`)
  async addMeal(meal: MealFormModel): Promise<void> {
    await this.addButton.click();
    await this.fillForm(meal);
    await this.saveButton.click();
  }

  @step((dish: string) => `Edytuj posiłek „${dish}”`)
  async editMeal(dish: string, meal: MealFormModel): Promise<void> {
    await this.clickEditItemButton(dish);
    await this.fillForm(meal);
    await this.saveButton.click();
  }
}
