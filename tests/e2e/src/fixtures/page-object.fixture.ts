import { LoginPage } from "@_src/pages/login.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { test as baseTest } from "@playwright/test";

interface Pages {
  loginPage: LoginPage;
  myTripsPage: MyTripsPage;
}

export const pageObjectTest = baseTest.extend<Pages>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
  myTripsPage: async ({ page }, use) => {
    const myTripsPage = new MyTripsPage(page);
    await myTripsPage.goto();
    await use(myTripsPage);
  },
});
