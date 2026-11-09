import { apiTest } from "@_src/fixtures/api.fixture";
import { pageObjectTest } from "@_src/fixtures/page-object.fixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(pageObjectTest, apiTest);

export { expect } from "@playwright/test";
