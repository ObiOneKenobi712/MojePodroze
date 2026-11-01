import { defineConfig, devices } from '@playwright/test';

// Aplikację uruchamiamy osobno: `docker compose up -d --build` (frontend :5173, backend :8000).
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    testIdAttribute: 'data-testid',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
