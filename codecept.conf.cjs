const { setHeadlessWhen } = require('@codeceptjs/configure');

setHeadlessWhen(process.env.HEADLESS === 'true');

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: './e2e/**/*_test.cjs',
  output: './e2e/output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: process.env.E2E_BASE_URL || 'http://localhost:3000',
      show: process.env.HEADLESS !== 'true',
      windowSize: '1440x900',
      waitForNavigation: 'load',
      waitForTimeout: 10000,
      waitForAction: Number(process.env.SLOW_MO ?? 400),
    },
  },
  include: {
    I: './e2e/steps_file.cjs',
  },
  plugins: {
    screenshot: {
      enabled: true,
    },
    retryFailedStep: {
      enabled: true,
      retries: 2,
    },
  },
  name: 'cruise-web-e2e',
};
