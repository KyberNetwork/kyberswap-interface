import { ChainId } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetPortfoliosQuery, useGetRealtimeBalanceQuery, useGetWalletsPortfoliosQuery } from 'services/portfolio'
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
import { isAddress } from 'utils'

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

const useParseWalletPortfolioParam = () => {
  const { wallet, portfolioId } = useParams<{ wallet?: string; portfolioId?: string }>()
  const qs = useParsedQueryString()
  const walletParam = String(wallet || qs.wallet || '')
  return { wallet: isAddress(ChainId.MAINNET, walletParam) || '', portfolioId }
}

export default function PortfolioDetail() {
  const [activeTab, setTab] = useState(PortfolioTab.TRANSACTIONS)
  const qs = useParsedQueryString()

  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const { data: portfolios = EMPTY_ARRAY } = useGetPortfoliosQuery()
  const activePortfolio = portfolios[0]

  const { data: wallets = EMPTY_ARRAY, isFetching: isLoadingWallet } = useGetWalletsPortfoliosQuery(
    { portfolioId: activePortfolio?.id },
    { skip: !activePortfolio?.id },
  )
  const activeWallet = wallets[0]

  const [chainIds, setChainIds] = useState<ChainId[]>([...MAINNET_NETWORKS])
  const [search, setSearch] = useState(wallet || portfolioId || '')

  const { isFetching: isLoadingPortfolio, data } = useGetRealtimeBalanceQuery(
    { query: search, chainIds },
    { skip: !search },
  )

  const isLoading: boolean = isLoadingPortfolio || isLoadingWallet

  const handleChangeChains = (chainIds: ChainId[]) => {
    setChainIds(chainIds)
  }

  const navigate = useNavigate()
  const onChangeWallet = (wallet?: string) => {
    setSearch(wallet || '')
    const newQs = { ...qs, wallet }
    if (!newQs.wallet) delete newQs.wallet
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const canShowOverview = !wallet && !portfolioId

  return (
    <PageWrapper>
      <Header />
      {canShowOverview ? (
        <Overview />
      ) : (
        <>
          <AddressPanel
            isLoading={isLoading}
            wallets={wallets}
            portfolios={portfolios}
            activePortfolio={activePortfolio}
            activeWallet={activeWallet}
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
          {activeTab === PortfolioTab.ALLOWANCES && <Allowances wallet={wallet} chainIds={chainIds} />}
          {activeTab === PortfolioTab.TRANSACTIONS && <Transactions wallet={wallet} chainIds={chainIds} />}
        </>
      )}

      <TutorialDisclaimer />
    </PageWrapper>
  )
}
