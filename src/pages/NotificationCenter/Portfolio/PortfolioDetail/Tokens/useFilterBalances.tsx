import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetPortfoliosSettingsQuery } from 'services/portfolio'

import { DataEntry } from 'components/EarningPieChart'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { PortfolioChainBalance, PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'

const mappingFn = (data: PortfolioWalletBalance | PortfolioChainBalance): DataEntry => {
  const chainId = Number(data.chainId) as ChainId
  const isChainInfo = !(data as PortfolioWalletBalance).tokenAddress
  const { tokenLogo, tokenSymbol } = data as PortfolioWalletBalance
  return {
    percent: +data.percentage,
    symbol: isChainInfo ? NETWORKS_INFO[chainId].name : tokenSymbol,
    logoUrl: isChainInfo ? NETWORKS_INFO[chainId].icon : tokenLogo,
    chainId: isChainInfo ? undefined : chainId,
  }
}

const useFilterBalances = () => {
  const { pathname } = useLocation()
  const { data: settings } = useGetPortfoliosSettingsQuery(undefined, {
    skip: !pathname.startsWith(APP_PATHS.MY_PORTFOLIO),
  })

  const filterBalance = useCallback(
    <T extends PortfolioWalletBalance | PortfolioChainBalance>(balances: T[]) => {
      if (!balances?.length) return { chartData: EMPTY_ARRAY, tableData: EMPTY_ARRAY }

      // filter amount > threshold
      const bigItems: T[] = []
      const chartData: DataEntry[] = []
      let othersPercent = 0

      balances.forEach(el => {
        const canShow = settings?.isHideDust
          ? parseFloat(el.valueUsd) >= Number(settings?.dustThreshold) && +el.percentage !== 0
          : true
        if (canShow) bigItems.push(el)

        if (canShow && chartData.length < 5) chartData.push(mappingFn(el))
        else othersPercent += +el.percentage
      })

      if (chartData.length && othersPercent) {
        chartData.push({
          symbol: t`Others`,
          percent: othersPercent,
        })
      }
      return { chartData, tableData: settings?.isHideDust ? bigItems : balances }
    },
    [settings],
  )

  return filterBalance
}
export default useFilterBalances
