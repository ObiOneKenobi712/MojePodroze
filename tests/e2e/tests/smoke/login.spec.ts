import { expect, test } from "@_src/fixtures/merge.fixture";
import { testUser1 } from "@_src/test-data/user.data";

test.use({ trace: "off", screenshot: "off" });

test("Logowanie poprawnymi danymi otwiera stronę Moje podróże @smoke", async ({ loginPage, page }) => {
  const expectedTitle = "Moje podróże";

  const myTripsPage = await loginPage.login(testUser1);
  const { mainMenu, newTripButton } = myTripsPage;

  await test.step("Zweryfikuj otwarcie strony Moje podróże", async () => {
    await expect(page).toHaveURL(myTripsPage.url);
    await expect(page).toHaveTitle(expectedTitle);
    await expect(mainMenu.activeTab, `Aktywna zakładka to „${expectedTitle}”`).toHaveText(expectedTitle);
    await expect(newTripButton).toBeVisible();
  });

  await test.step("Zweryfikuj, że użytkownik jest zalogowany", async () => {
    await expect(mainMenu.logoutButton).toBeVisible();
  });
});
