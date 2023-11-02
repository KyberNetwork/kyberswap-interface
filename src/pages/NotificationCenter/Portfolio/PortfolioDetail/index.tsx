import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { MAINNET_NETWORKS } from 'constants/networks'
import AddressPanel from 'pages/NotificationCenter/Portfolio/PortfolioDetail/AddressPanel'
import ListTab from 'pages/NotificationCenter/Portfolio/PortfolioDetail/ListTab'
import Overview from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Overview'
import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TokenAllocation'
import TutorialDisclaimer from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TutorialDisclaimer'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/WalletInfo'
import { PortfolioTab } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/type'

import Header from './Header'

const PageWrapper = styled.div`
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
  const { wallet } = useParams<{ wallet: string }>()
  const canShowOverview = !wallet
  return (
    <PageWrapper>
      <Header />
      {canShowOverview ? (
        <Overview />
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

      <TutorialDisclaimer />
    </PageWrapper>
  )
}
