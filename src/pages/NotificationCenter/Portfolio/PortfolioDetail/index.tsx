import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  useGetPortfolioByIdQuery,
  useGetPortfoliosQuery,
  useGetRealtimeBalanceQuery,
  useGetWalletsPortfoliosQuery,
} from 'services/portfolio'
import styled from 'styled-components'

import Wallet from 'components/Icons/Wallet'
import LocalLoader from 'components/LocalLoader'
import Row, { RowBetween } from 'components/Row'
import Select from 'components/Select'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import useParsedQueryString from 'hooks/useParsedQueryString'
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
import {
  Portfolio,
  PortfolioTab,
  PortfolioWallet,
  PortfolioWalletBalanceResponse,
} from 'pages/NotificationCenter/Portfolio/type'
import getShortenAddress from 'utils/getShortenAddress'
import { isInEnum } from 'utils/string'

import Header from './Header'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 36px;
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

const useFetchPortfolio = (): {
  wallets: PortfolioWallet[]
  isLoading: boolean
  portfolio: Portfolio | undefined
  myPortfolios: Portfolio[]
} => {
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

const ChainWalletSelect = styled(Row)`
  gap: 12px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: space-between;
`};
`

export default function PortfolioDetail() {
  const { tab = '' } = useParsedQueryString<{ tab: string }>()
  const [activeTab, setTab] = useState(isInEnum(tab, PortfolioTab) ? tab : PortfolioTab.TOKEN)

  const [, setSearchParams] = useSearchParams()
  const onChangeTab = (tab: PortfolioTab) => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    setSearchParams(params) // reset params
    setTab(tab)
  }

  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const { portfolio: activePortfolio, myPortfolios, wallets, isLoading: isLoadingPortfolio } = useFetchPortfolio()
  const walletsQuery = useMemo(
    () => (wallet ? [wallet] : wallets.length ? wallets.map(e => e.walletAddress) : EMPTY_ARRAY),
    [wallets, wallet],
  )

  const [chainIds, setChainIds] = useState<ChainId[]>([...MAINNET_NETWORKS])

  const queryBalance = wallet || portfolioId || ''
  const { isFetching: isLoadingRealtimeData, data } = useGetRealtimeBalanceQuery(
    { query: queryBalance, chainIds },
    { skip: !queryBalance },
  )

  const isLoading: boolean = isLoadingPortfolio || isLoadingRealtimeData

  const handleChangeChains = (chainIds: ChainId[]) => {
    setChainIds(chainIds)
  }

  const { pathname } = useLocation()
  const navigate = useNavigateToPortfolioDetail()
  const onChangeWallet = (wallet?: string) => {
    navigate({ myPortfolio: pathname.startsWith(APP_PATHS.MY_PORTFOLIO), wallet, portfolioId })
  }
  const theme = useTheme()
  const canShowOverview = !wallet && !portfolioId

  const walletsOpts = useMemo(() => {
    const opt = wallets.map(wallet => ({
      label: wallet.nickName
        ? `${wallet.nickName} - ${getShortenAddress(wallet.walletAddress)}`
        : getShortenAddress(wallet.walletAddress),
      value: wallet.walletAddress,
    }))
    return activeTab === PortfolioTab.TRANSACTIONS ? opt : [{ label: t`All Wallets`, value: '' }, ...opt]
  }, [wallets, activeTab])

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
          <RowBetween flexWrap={'wrap'} gap="16px">
            <ListTab activeTab={activeTab} setTab={onChangeTab} />
            <ChainWalletSelect>
              {portfolioId && walletsOpts.length && (
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
              )}
              <MultipleChainSelect
                selectedChainIds={chainIds}
                handleChangeChains={handleChangeChains}
                style={{ height: '36px' }}
              />
            </ChainWalletSelect>
          </RowBetween>
          {activeTab === PortfolioTab.TOKEN && <Tokens isLoading={isLoading} data={data} />}
          {activeTab === PortfolioTab.ALLOWANCES && <Allowances walletAddresses={walletsQuery} chainIds={chainIds} />}
          {activeTab === PortfolioTab.TRANSACTIONS && (
            <Transactions wallet={wallet || wallets?.[0].walletAddress} chainIds={chainIds} />
          )}
          {activeTab === PortfolioTab.NFT && <Nft walletAddresses={walletsQuery} chainIds={chainIds} />}
        </>
      )}

      <TutorialDisclaimer showOverview={canShowOverview} />
    </PageWrapper>
  )
}
