import { ChainId } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetPortfoliosQuery, useGetRealtimeBalanceQuery } from 'services/portfolio'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { EMPTY_ARRAY } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import AddressPanel from 'pages/NotificationCenter/Portfolio/PortfolioDetail/AddressPanel'
import Allowances from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Allowances'
import ListTab from 'pages/NotificationCenter/Portfolio/PortfolioDetail/ListTab'
import Overview from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Overview'
import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import Transactions from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Transactions'
import TutorialDisclaimer from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TutorialDisclaimer'
import { PortfolioTab } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/type'
import { PortfolioWalletBalanceResponse } from 'pages/NotificationCenter/Portfolio/type'

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

const Tokens = ({ data, isLoading }: { data: PortfolioWalletBalanceResponse | undefined; isLoading: boolean }) => {
  return (
    <>
      <TokenAllocation balances={data?.balances} totalBalanceUsd={55} loading={isLoading} />
      <WalletInfo balances={data?.balances} loading={isLoading} />
    </>
  )
}

export default function PortfolioDetail() {
  const [activeTab, setTab] = useState(PortfolioTab.TRANSACTIONS)
  const { wallet, portfolioId } = useParams<{ wallet?: string; portfolioId?: string }>()
  const qs = useParsedQueryString()
  const { data: portfolios = EMPTY_ARRAY } = useGetPortfoliosQuery()

  const walletParam = String(wallet || qs.wallet)

  const [chainIds, setChainIds] = useState<ChainId[]>([...MAINNET_NETWORKS])
  const [search, setSearch] = useState(walletParam || portfolioId || '')

  const { isLoading, data } = useGetRealtimeBalanceQuery({ query: String(search), chainIds }, { skip: !search })

  const handleChangeChains = (chainIds: ChainId[]) => {
    setChainIds(chainIds)
  }

  const navigate = useNavigate()
  const onChangeWallet = (wallet: string) => {
    setSearch(wallet)
    navigate({ search: stringify({ ...qs, wallet }) }, { replace: true })
  }

  const canShowOverview = !wallet && !portfolioId
  const activePortfolio = portfolios[0]
  return (
    <PageWrapper>
      <Header />
      {canShowOverview ? (
        <Overview />
      ) : (
        <>
          <AddressPanel
            portfolios={portfolios}
            activePortfolio={activePortfolio}
            data={data}
            onChangeWallet={onChangeWallet}
          />
          <RowBetween>
            <ListTab activeTab={activeTab} setTab={setTab} />
            <MultipleChainSelect
              selectedChainIds={chainIds}
              handleChangeChains={handleChangeChains}
              style={{ height: '36px' }}
            />
          </RowBetween>
          {activeTab === PortfolioTab.TOKEN && <Tokens isLoading={isLoading} data={data} />}
          {activeTab === PortfolioTab.ALLOWANCES && <Allowances wallet={walletParam} chainIds={chainIds} />}
          {activeTab === PortfolioTab.TRANSACTIONS && <Transactions wallet={walletParam} chainIds={chainIds} />}
        </>
      )}

      <TutorialDisclaimer />
    </PageWrapper>
  )
}
