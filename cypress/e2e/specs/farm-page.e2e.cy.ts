import { FarmPage } from "../pages/farm-page.po.cy";
import { SwapPage } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, TAG, } from "../selectors/constants.cy"
const farm = new FarmPage()

describe('Farm', { tags: TAG.regression }, () => {
    beforeEach(() => {
        SwapPage.open(DEFAULT_URL)
        farm.goToFarmPage()
        cy.wait(5000)
        farm.checkExistData().then((value) => {
            if (value === true) {
                cy.wrap(farm.getAprValues()).as('arrApr')
                cy.wrap(farm.getTvlValues()).as('arrTvl')
            }
            cy.wrap(value).as('checkData')
        })
    })
    it('Should be displayed APR and TVL values', function () {
        if (this.checkData === true) {
            const count = farm.countInvalidFarms(this.arrApr, this.arrTvl)
            expect(count).not.to.equal(this.arrApr.length)
        }
    })
})
