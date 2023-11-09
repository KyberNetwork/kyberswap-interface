import { PoolLocators } from '../selectors/selectors.cy'

export enum CustomRange {
  FullRange = 'Full Range',
  Safe = 'Safe',
  Common = 'Common',
  Expert = 'Expert',
}
export type FarmingRange = {
  minPrice: string
  maxPrice: string
}
export const PoolsPage = {
  open(chain: string) {
    cy.visit('/pools/' + chain)
  },
  searchByPoolAddress(poolAddress: string) {
    cy.get(PoolLocators.txtSearchPool).clear().type(poolAddress)
    cy.wait(2000)
  },
  selectCustomRange(range: CustomRange) {
    cy.get('button').contains(range).click()
  },
  selectFarmingRange(farmingRange: FarmingRange) {
    cy.get('[role=button]').contains('Farming Ranges').click()
    cy.get(PoolLocators.txtPriceValue).eq(0).clear().type(farmingRange.minPrice)
    cy.get(PoolLocators.txtPriceValue).eq(1).clear().type(farmingRange.maxPrice)
  },
  getCurrentPrice() {
    return cy
      .get(PoolLocators.lblCurrentPrice)
      .invoke('text')
      .then(currenPriceValue => {
        return currenPriceValue
      })
  },
  addLiquidity(poolAddress: string, amountIn: string, customRange?: CustomRange, farmingRange?: FarmingRange) {
    PoolsPage.searchByPoolAddress(poolAddress)
    cy.get('button').contains('Add Liquidity').click()
    cy.get(PoolLocators.btnZapIn).click()
    if (typeof customRange != 'undefined') {
      PoolsPage.selectCustomRange(customRange)
    }
    if (typeof farmingRange != 'undefined') {
      PoolsPage.selectFarmingRange(farmingRange)
    }
    cy.get(PoolLocators.txtAmountIn).type(amountIn)
    cy.wait(20000)
    cy.go('back')
  },
}
