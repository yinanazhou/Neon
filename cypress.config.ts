import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
    video: false,
    numTestsKeptInMemory: 0,
    retries: 2
  },
});
