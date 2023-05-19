import { defineConfig } from 'cypress'

console.log(process.env)
console.log(import.meta)

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: `https://kyberswap-interface-${process.env.VITE_PR_NUMBER}.pr.kyberengineering.io/`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
