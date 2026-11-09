import { STORAGE_STATE } from "@_pw-config";
import { TripsApi } from "@_src/api/trips.api";
import { test as baseTest } from "@playwright/test";
import * as fs from "fs";

interface Api {
  tripsApi: TripsApi;
}

interface StorageEntry {
  name: string;
  value: string;
}

function readUserIdFromSession(): string {
  const session = JSON.parse(fs.readFileSync(STORAGE_STATE, "utf-8"));
  const entries: StorageEntry[] = session.origins[0].localStorage;
  const userIdEntry = entries.find((entry) => entry.name === "userId");

  if (userIdEntry === undefined) {
    throw new Error("Sesja nie zawiera identyfikatora użytkownika.");
  }

  return userIdEntry.value;
}

export const apiTest = baseTest.extend<Api>({
  tripsApi: async ({ request }, use) => {
    await use(new TripsApi(request, readUserIdFromSession()));
  },
});
