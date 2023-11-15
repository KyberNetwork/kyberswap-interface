import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  useGetPortfolioByIdQuery,
  useGetPortfoliosQuery,
  useGetRealtimeBalanceQuery,
  useGetWalletsPortfoliosQuery,
} from 'services/portfolio'
import styled from 'styled-components'

import Wallet from 'components/Icons/Wallet'
import LocalLoader from 'components/LocalLoader'
import Row, { RowBetween, RowFit } from 'components/Row'
import Select from 'components/Select'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import AddressPanel from 'pages/NotificationCenter/Portfolio/PortfolioDetail/AddressPanel'
import Allowances from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Allowances'
import ListTab from 'pages/NotificationCenter/Portfolio/PortfolioDetail/ListTab'
import Nft from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft'
import Overview from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Overview'
import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import Transactions from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Transactions'
import TutorialDisclaimer from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TutorialDisclaimer'
import { useNavigateToPortfolioDetail, useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'
import { PortfolioTab, PortfolioWalletBalanceResponse } from 'pages/NotificationCenter/Portfolio/type'
import getShortenAddress from 'utils/getShortenAddress'

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

const useFetchPortfolio = () => {
  const { portfolioId } = useParseWalletPortfolioParam()
  const { data: portfolio, isFetching: isLoadingMyPortfolio } = useGetPortfolioByIdQuery(
    { id: portfolioId || '' },
    { skip: !portfolioId },
  )
  const { data: myPortfolios = EMPTY_ARRAY, isFetching: isLoadingPortfolio } = useGetPortfoliosQuery()
  const { data: wallets = EMPTY_ARRAY, isFetching: isLoadingWallet } = useGetWalletsPortfoliosQuery(
    { portfolioId: portfolio?.id || '' },
    { skip: !portfolio?.id },
  )

  const isLoading = useShowLoadingAtLeastTime(isLoadingWallet || isLoadingPortfolio || isLoadingMyPortfolio, 500)
  return {
    portfolio: !portfolioId ? undefined : portfolio,
    myPortfolios: myPortfolios,
    wallets,
    isLoading,
  }
}

export default function PortfolioDetail() {
  const [activeTab, setTab] = useState(PortfolioTab.NFT)

  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const { portfolio: activePortfolio, myPortfolios, wallets, isLoading: isLoadingPortfolio } = useFetchPortfolio()

  const [chainIds, setChainIds] = useState<ChainId[]>([...MAINNET_NETWORKS])
  const [search, setSearch] = useState(wallet || portfolioId || '')

  const { isFetching: isLoadingRealtimeData, data } = useGetRealtimeBalanceQuery(
    { query: search, chainIds },
    { skip: !search },
  )

  const isLoading: boolean = isLoadingPortfolio || isLoadingRealtimeData // todo

  const handleChangeChains = (chainIds: ChainId[]) => {
    setChainIds(chainIds)
  }

  const { pathname } = useLocation()
  const navigate = useNavigateToPortfolioDetail()
  const onChangeWallet = (wallet?: string) => {
    setSearch(wallet || '')
    navigate({ myPortfolio: pathname.startsWith(APP_PATHS.MY_PORTFOLIO), wallet, portfolioId })
  }
  const theme = useTheme()
  const canShowOverview = !wallet && !portfolioId

  const walletsOpts = useMemo(() => {
    const opt = wallets.map(wallet => ({
      label: wallet.nickName || getShortenAddress(wallet.walletAddress),
      value: wallet.walletAddress,
    }))
    return [{ label: t`All Wallets`, value: '' }, ...opt]
  }, [wallets])

  return (
    <PageWrapper>
      <Header />
      {isLoadingPortfolio ? (
        <LocalLoader />
      ) : canShowOverview ? (
        <Overview />
      ) : (
        <>
          <AddressPanel
            isLoading={isLoading}
            wallets={wallets}
            myPortfolios={myPortfolios}
            activePortfolio={activePortfolio}
            data={data}
            onChangeWallet={onChangeWallet}
          />
          <RowBetween>
            <ListTab activeTab={activeTab} setTab={setTab} />
            <RowFit gap="12px">
              <Select
                onChange={onChangeWallet}
                style={{ borderRadius: 24, background: theme.buttonGray, height: 36, minWidth: 150 }}
                options={walletsOpts}
                activeRender={item => (
                  <Row gap="6px" fontSize={'14px'} fontWeight={'500'}>
                    <Wallet />
                    {item?.label}
                  </Row>
                )}
              />
              <MultipleChainSelect
                selectedChainIds={chainIds}
                handleChangeChains={handleChangeChains}
                style={{ height: '36px' }}
              />
            </RowFit>
          </RowBetween>
          {activeTab === PortfolioTab.TOKEN && <Tokens isLoading={isLoading} data={data} />}
          {activeTab === PortfolioTab.ALLOWANCES && <Allowances wallet={wallet} chainIds={chainIds} />}
          {activeTab === PortfolioTab.TRANSACTIONS && <Transactions wallet={wallet} chainIds={chainIds} />}
          {activeTab === PortfolioTab.NFT && <Nft wallet={wallet} chainIds={chainIds} />}
        </>
      )}

      <TutorialDisclaimer showOverview={canShowOverview} />
    </PageWrapper>
  )
}
