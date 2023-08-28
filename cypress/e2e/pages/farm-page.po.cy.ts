import { FarmLocators, HeaderLocators } from "../selectors/selectors.cy"

export class FarmPage {

    getTvlValues() {
        const arr: string[] = []
        const listData = cy.get(FarmLocators.lblTvl)
        listData
            .each(item => {
                arr.push(item.text().split('$')[1])
            })
        return arr
    }

    getAprValues() {
        const arr: string[] = []
        const listData = cy.get(FarmLocators.lblApr)
        listData
            .each(item => {
                arr.push(item.text().split('%')[0])
            })
        return arr
    }

    countInvalidFarms(arrApr: string[], arrTvl: string[]) {
        const totalFarms = arrApr.length
        let count = 0;
        for (let i = 0; i < totalFarms; i++) {
            if (((arrTvl[i]) === undefined || Number(arrTvl[i]) === 0) && Number(arrApr[i]) === 0) {
                count = count + 1;
            }
        }
        return count
    }

    goToFarmPage() {
        cy.get(HeaderLocators.dropdownEarn).click({ force: true })
        cy.get(HeaderLocators.lblFarms).click({ force: true })
    }

    checkExistData() {
        return cy.get(FarmLocators.lblApr, {timeout: 5000}).should(() => { }).then($obj => {
            if ($obj.length > 0) {
                return true
            }
            else {
                return false
            }
        })
    }
}