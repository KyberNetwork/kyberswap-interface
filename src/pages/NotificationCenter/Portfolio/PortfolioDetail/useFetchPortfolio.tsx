import { useMemo } from 'react'
import {
  useGetMyPortfoliosQuery,
  useGetPortfolioByIdQuery,
  useGetPortfolioRealtimeBalanceQuery,
  useGetWalletsPortfoliosQuery,
} from 'services/portfolio'

import { EMPTY_ARRAY } from 'constants/index'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import { PortfolioOption } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/AddressPanel'
import { useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'
import { Portfolio, PortfolioWallet } from 'pages/NotificationCenter/Portfolio/type'

export type PortfolioInfos = {
  wallets: PortfolioWallet[]
  walletsQuery: string[]
  isLoading: boolean
  portfolio: Portfolio | undefined
  myPortfolios: Portfolio[]
  portfolioOptions: PortfolioOption[]
  loadMyPortfolioError: boolean
  isLoadingMyPortfolio: boolean
}

const useFetchPortfolio = (): PortfolioInfos => {
  const { portfolioId, wallet } = useParseWalletPortfolioParam()
  const { currentData: currentPortfolio, isFetching: isLoadingCurrentPortfolio } = useGetPortfolioByIdQuery(
    { id: portfolioId || '' },
    { skip: !portfolioId },
  )
  const { currentData: wallets = EMPTY_ARRAY, isFetching: isLoadingWallet } = useGetWalletsPortfoliosQuery(
    { portfolioId: currentPortfolio?.id || '' },
    { skip: !currentPortfolio?.id },
  )

  const {
    data: myPortfolios = EMPTY_ARRAY as Portfolio[],
    isFetching: isLoadingMyPortfolio,
    isError,
  } = useGetMyPortfoliosQuery()

  const ids = useMemo(() => myPortfolios.map(e => e.id), [myPortfolios])
  const { data: balances } = useGetPortfolioRealtimeBalanceQuery({ ids }, { skip: !ids.length })

  const portfolioOptions = useMemo(
    () =>
      myPortfolios.map(portfolio => ({
        portfolio,
        totalUsd: Number(balances?.find(e => e.portfolioId === portfolio.id)?.totalUsd) || 0,
        active: portfolio?.id === portfolioId,
      })),
    [myPortfolios, balances, portfolioId],
  )

  const isLoading = useShowLoadingAtLeastTime(isLoadingWallet || isLoadingMyPortfolio || isLoadingCurrentPortfolio, 500)

  const walletsQuery: string[] = useMemo(
    () => (wallet ? [wallet] : wallets.length ? wallets.map(e => e.walletAddress) : EMPTY_ARRAY),
    [wallets, wallet],
  )

  return {
    // current portfolio by url
    portfolio: currentPortfolio,
    wallets,
    walletsQuery,
    isLoading,
    // all my portfolio
    myPortfolios,
    portfolioOptions,
    loadMyPortfolioError: isError,
    isLoadingMyPortfolio,
  }
}
export default useFetchPortfolio
