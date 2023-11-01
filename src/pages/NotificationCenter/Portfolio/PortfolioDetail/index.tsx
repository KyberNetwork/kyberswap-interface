import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { MAINNET_NETWORKS } from 'constants/networks'
import Disclaimer from 'pages/NotificationCenter/Portfolio/Modals/Disclaimer'
import AddressPanel from 'pages/NotificationCenter/Portfolio/PortfolioDetail/AddressPanel'
import ListTab from 'pages/NotificationCenter/Portfolio/PortfolioDetail/ListTab'
import Overview from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Overview'
import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TokenAllocation'
import TutorialPortfolio from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TutorialPortfolio'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/WalletInfo'
import { PortfolioTab } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/type'

import Header from './Header'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 36px 0;
  gap: 24px;
  width: 100%;
  max-width: 1464px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
    padding: 20px 16px;
`};
`

export default function PortfolioDetail() {
  const [activeTab, setTab] = useState(PortfolioTab.TOKEN)

  const [chainIds, setChainIds] = useState<ChainId[]>([...MAINNET_NETWORKS]) // todo
  const handleChangeChains = (values: ChainId[]) => {
    setChainIds(values)
  }
  const canShowTutorial = true
  return (
    <PageWrapper>
      <Header />
      {canShowTutorial ? (
        <>
          <TutorialPortfolio />
          <Disclaimer />
          <Overview />
        </>
      ) : (
        <>
          <AddressPanel />
          <RowBetween>
            <ListTab activeTab={activeTab} setTab={setTab} />
            <MultipleChainSelect
              chainIds={chainIds}
              selectedChainIds={chainIds}
              handleChangeChains={handleChangeChains}
              style={{ height: '36px' }}
            />
          </RowBetween>
          <TokenAllocation />
          <WalletInfo />
        </>
      )}
    </PageWrapper>
  )
}
