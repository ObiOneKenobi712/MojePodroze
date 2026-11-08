import { STORAGE_STATE } from "@_pw-config";
import { testUser1 } from "@_src/test-data/user.data";
import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";

async function globalSetup(config: FullConfig): Promise<void> {
  if (fs.existsSync(STORAGE_STATE)) {
    fs.unlinkSync(STORAGE_STATE);
  }

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ baseURL });

    await page.goto("/logowanie");
    await page.getByTestId("input-login").fill(testUser1.userLogin);
    await page.getByTestId("input-password").fill(testUser1.userPassword);

    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
    );
    await page.getByTestId("btn-login").click();
    const loginResponse = await loginResponsePromise;

    if (loginResponse.status() !== 200) {
      throw new Error(`Logowanie nie powiodło się, status odpowiedzi: ${loginResponse.status()}`);
    }

    await page.waitForURL("**/podroze");
    await page.context().storageState({ path: STORAGE_STATE });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
