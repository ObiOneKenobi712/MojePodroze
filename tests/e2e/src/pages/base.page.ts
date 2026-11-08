import { step } from "@_src/utils/step.decorator";
import { Page } from "@playwright/test";

export class BasePage {
  url: string;

  constructor(protected page: Page) {
    this.url = "/";
  }

  @step()
  async goto(parameters = ""): Promise<void> {
    await this.page.goto(`${this.url}${parameters}`);
  }

  async getTitle(): Promise<string> {
    await this.page.waitForLoadState();
    return this.page.title();
  }

  async waitForPageToLoadUrl(): Promise<void> {
    await this.page.waitForURL(this.url);
  }
}
